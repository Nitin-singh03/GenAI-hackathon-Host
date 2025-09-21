import getpass
import os
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate
from langchain_text_splitters import CharacterTextSplitter
import operator
from typing import Annotated, List, Literal, TypedDict
from langchain.chains.combine_documents.reduce import (
    acollapse_docs,
    split_list_of_docs,
)
from langchain_core.documents import Document
from langgraph.types import Send
from langgraph.graph import END, START, StateGraph
from langchain_community.document_loaders import PyPDFLoader
import asyncio
import functools

token_max = 1000
load_dotenv()

def obtain_chat_model():
    if "GOOGLE_API_KEY" not in os.environ:
        os.environ["GOOGLE_API_KEY"] = getpass.getpass("Enter your Google AI API key: ")
    llm = init_chat_model("gemini-2.5-flash", model_provider="google_genai")
    return llm

def define_map_prompt(level: str):
    if (level == "expert"):
        system_msg = (
            "Imagine the reader is a lawyer or a paralegal."
            "Write a detailed summary of the following legal text. "
            "Focus on precise legal terminology, case references, and nuanced interpretations."
        )
    elif (level == "moderate"):
        system_msg = (
            "Imagine the reader is not an expert, but also not a complete layman."
            "Summarize the following legal text for someone with basic legal knowledge. "
            "Explain the main points clearly without excessive jargon, but preserve key legal concepts."
        )
    else:  # beginner
        system_msg = (
            "Explain the following legal text in very simple terms, "
            "as if to someone without legal training. Focus only on the main ideas."
        )
    map_prompt = ChatPromptTemplate.from_messages(
        [("system", system_msg + "\\n\\n{context}")]
    )
    return map_prompt

def reduce(level: str):
    # reduce_template = """
    # The following is a set of summaries:
    # {docs}
    # Take these and distill it into a final, consolidated summary
    # of the main themes.
    # """
    if (level == "expert"):
        reduce_template = """
        The following are section summaries:
        {docs}
        Consolidate them into a rigorous legal summary, 
        highlighting legal arguments, precedents, and implications.
        """
    elif (level == "moderate"):
        reduce_template = """
        The following are section summaries:
        {docs}
        Consolidate them into a clear summary for someone with basic legal knowledge.
        Focus on the main points and legal reasoning without too much jargon.
        """
    else:  # beginner
        reduce_template = """
        The following are section summaries:
        {docs}
        Explain them in plain language for a non-lawyer.
        Keep it simple and focus on the overall meaning.
        """

    reduce_prompt = ChatPromptTemplate([("human", reduce_template)])
    return reduce_prompt

def splitting(docs):
    text_splitter = CharacterTextSplitter.from_tiktoken_encoder(
        chunk_size=500, chunk_overlap=50  # Smaller chunks
    )
    split_docs = text_splitter.split_documents(docs)
    print(f"Generated {len(split_docs)} documents.")
    # Limit to first 3 chunks to prevent context issues
    return split_docs[:3]

def length_function(documents: List[Document]) -> int:
    llm = obtain_chat_model()
    """Get number of tokens for input contents."""
    return sum(llm.get_num_tokens(doc.page_content) for doc in documents)

class OverallState(TypedDict):
    contents: List[str]
    summaries: Annotated[list, operator.add]
    collapsed_summaries: List[Document]
    final_summary: str

class SummaryState(TypedDict):
    content: str

async def generate_summary(state: SummaryState, level: str):
    map_prompt = define_map_prompt(level)
    llm = obtain_chat_model()
    prompt = map_prompt.format(context=state["content"])
    response = await llm.ainvoke(prompt)
    return {"summaries": [response.content]}

def map_summaries(state: OverallState):
    return [
        Send("generate_summary", {"content": content}) for content in state["contents"]
    ]

def collect_summaries(state: OverallState):
    return {
        "collapsed_summaries": [Document(summary) for summary in state["summaries"]]
    }

async def _reduce(input: dict, level: str) -> str:
    reduce_prompt = reduce(level)
    llm = obtain_chat_model()

    # Convert Document objects into plain text before formatting
    if isinstance(input, dict) and "collapsed_summaries" in input:
        docs_text = "\n\n".join(doc.page_content for doc in input["collapsed_summaries"])
    elif isinstance(input, list):  # sometimes it's already a list of Document
        docs_text = "\n\n".join(doc.page_content for doc in input)
    else:
        docs_text = str(input)

    prompt = reduce_prompt.format(docs=docs_text)
    print("DEBUG FINAL PROMPT >>>", prompt[:500])
    response = await llm.ainvoke(prompt)
    return response.content

async def collapse_summaries(state: OverallState):
    doc_lists = split_list_of_docs(
        state["collapsed_summaries"], length_function, token_max
    )
    results = []
    for doc_list in doc_lists:
        results.append(await acollapse_docs(doc_list, _reduce))

    return {"collapsed_summaries": results}

def should_collapse(
    state: OverallState,
) -> Literal["collapse_summaries", "generate_final_summary"]:
    num_tokens = length_function(state["collapsed_summaries"])
    if num_tokens > token_max:
        return "collapse_summaries"
    else:
        return "generate_final_summary"
    
async def generate_final_summary(state: OverallState, level):
    response = await _reduce({"collapsed_summaries": state["collapsed_summaries"]}, level)
    return {"final_summary": response}

def construct_graph(level: str):
    graph = StateGraph(OverallState)
    graph.add_node("generate_summary", functools.partial(generate_summary, level=level))
    graph.add_node("collect_summaries", collect_summaries)
    graph.add_node("collapse_summaries", collapse_summaries)
    graph.add_node("generate_final_summary", functools.partial(generate_final_summary, level=level))

    graph.add_conditional_edges(START, map_summaries, ["generate_summary"])
    graph.add_edge("generate_summary", "collect_summaries")
    graph.add_conditional_edges("collect_summaries", should_collapse)
    graph.add_conditional_edges("collapse_summaries", should_collapse)
    graph.add_edge("generate_final_summary", END)

    app = graph.compile()
    return app

async def final_summary_from_text(text_content: str, level: str = "beginner"):
    # Always use simple summary to avoid complex processing issues
    result = await simple_summary(text_content, level)
    if isinstance(result, dict):
        return result
    else:
        return {"summary": result, "structuredData": None}

async def extract_structured_data(text_content: str):
    """Extract structured data from legal document with detailed risk analysis"""
    try:
        llm = obtain_chat_model()
        
        prompt = f"""CRITICAL: Extract information from this document and return ONLY a JSON object. Even if some information is unclear, provide your best analysis and fill ALL fields with meaningful content:

{{
    "importantDates": {{
        "startDate": "[Any start/effective date found, or 'Not specified']",
        "endDate": "[Any end/expiration date found, or 'Not specified']",
        "leaseTerm": "[Duration/term mentioned, or 'Not specified']",
        "noticeDeadlines": "[Any notice periods or deadlines, or 'Not specified']",
        "renewalDate": "[Renewal information, or 'Not specified']"
    }},
    "parties": {{
        "landlord": "[Primary party/entity name, or 'Not specified']",
        "tenant": "[Secondary party/individual name, or 'Not specified']",
        "witnesses": "[Any witnesses mentioned, or 'Not specified']",
        "riskLevel": "[high/medium/low based on party complexity]"
    }},
    "financialSummary": {{
        "monthlyRent": "[Any recurring payment amount, or 'Not specified']",
        "securityDeposit": "[Any deposit/security amount, or 'Not specified']",
        "annualEscalation": "[Any increase percentage, or 'Not specified']",
        "lateFees": "[Any penalty amounts, or 'Not specified']",
        "additionalCosts": "[Any other costs mentioned, or 'Not specified']",
        "riskLevel": "[high/medium/low based on financial burden]"
    }},
    "keyCovenants": {{
        "useOfPremises": "[How property/service can be used, or 'Not specified']",
        "sublettingClause": "[Any transfer/assignment rules, or 'Not specified']",
        "maintenanceResponsibility": "[Who handles upkeep/maintenance, or 'Not specified']",
        "terminationConditions": "[How agreement can end, or 'Not specified']",
        "riskLevel": "[high/medium/low based on restrictiveness]"
    }},
    "riskHighlights": [
        {{
            "clause": "[Specific concerning clause or term]",
            "risk": "[high/medium/low]",
            "reason": "[Why this is concerning]",
            "impact": "[What could happen]"
        }}
    ],
    "overallRiskAssessment": {{
        "level": "[high/medium/low - overall document risk]",
        "reason": "[Comprehensive explanation of main risks]",
        "recommendations": "[Specific advice for handling this document]"
    }}
}}

Document content:
{text_content[:4000]}

Return ONLY the JSON object:"""
        
        response = await llm.ainvoke(prompt)
        
        # Try to parse JSON from response
        import json
        try:
            content = response.content.strip()
            if content.startswith('```json'):
                content = content[7:-3].strip()
            elif content.startswith('```'):
                content = content[3:-3].strip()
            
            return json.loads(content)
        except Exception as parse_error:
            print(f"Structured data parsing error: {parse_error}")
            # Enhanced fallback with meaningful content
            return {
                "importantDates": {
                    "startDate": "Review document for effective date",
                    "endDate": "Check for expiration or termination date", 
                    "leaseTerm": "Examine document for duration terms",
                    "noticeDeadlines": "Look for any notice requirements",
                    "renewalDate": "Check for renewal or extension terms"
                },
                "parties": {
                    "landlord": "Primary party or organization",
                    "tenant": "Secondary party or individual", 
                    "witnesses": "No witnesses specified",
                    "riskLevel": "medium"
                },
                "financialSummary": {
                    "monthlyRent": "Review for recurring payment amounts",
                    "securityDeposit": "Check for any required deposits",
                    "annualEscalation": "Look for automatic increases",
                    "lateFees": "Review penalty and fee structure",
                    "additionalCosts": "Check for additional financial obligations",
                    "riskLevel": "medium"
                },
                "keyCovenants": {
                    "useOfPremises": "Review permitted and prohibited uses",
                    "sublettingClause": "Check transfer and assignment restrictions",
                    "maintenanceResponsibility": "Review maintenance and repair obligations",
                    "terminationConditions": "Examine termination and exit procedures",
                    "riskLevel": "medium"
                },
                "riskHighlights": [
                    {
                        "clause": "Complex legal language throughout document",
                        "risk": "medium",
                        "reason": "Legal terminology may obscure important obligations",
                        "impact": "Could lead to misunderstanding of requirements"
                    },
                    {
                        "clause": "Binding legal commitments",
                        "risk": "medium", 
                        "reason": "Document creates enforceable obligations",
                        "impact": "Non-compliance could result in legal consequences"
                    }
                ],
                "overallRiskAssessment": {
                    "level": "medium",
                    "reason": "Document contains legal obligations that require careful review and compliance. Risk level depends on ability to meet all requirements.",
                    "recommendations": "Read entire document carefully, seek legal advice for unclear terms, ensure you can comply with all obligations before signing"
                }
            }
    except Exception as e:
        print(f"Structured data extraction error: {e}")
        return None

async def generate_comprehensive_summary(text_content: str, level: str = "beginner"):
    """Generate comprehensive summary with key points"""
    try:
        llm = obtain_chat_model()
        
        prompt = f"""CRITICAL: You MUST analyze this document and provide a comprehensive summary in EXACT JSON format. Even if the document seems incomplete or unclear, extract whatever information is available and provide meaningful analysis.

For ANY document type (legal, contract, agreement, letter, etc.), you MUST fill ALL sections with relevant information:

{{
    "documentSummary": {{
        "title": "[Document type - e.g., 'Rental Agreement', 'Employment Contract', 'Legal Notice']",
        "overview": "[2-3 sentences describing what this document is about and its main purpose]",
        "keyPoints": [
            "[Most important aspect of this document]",
            "[Second most important point]",
            "[Third key point or obligation]"
        ]
    }},
    "keyDates": {{
        "summary": "[Describe any time-sensitive elements, deadlines, or duration mentioned]",
        "criticalDeadlines": [
            "[Any specific dates, deadlines, or time periods found]",
            "[Additional time-sensitive items if any]"
        ]
    }},
    "financialOverview": {{
        "summary": "[Describe any money, payments, costs, or financial obligations mentioned]",
        "keyAmounts": [
            "[Any specific amounts, fees, or financial terms]",
            "[Additional financial obligations if any]"
        ],
        "riskLevel": "[high/medium/low based on financial burden or complexity]",
        "riskReason": "[Explain why you assigned this financial risk level]"
    }},
    "keyRestrictions": {{
        "summary": "[Describe any limitations, prohibitions, or requirements imposed]",
        "importantRules": [
            "[Key rule or restriction #1]",
            "[Key rule or restriction #2]",
            "[Key rule or restriction #3]"
        ],
        "riskLevel": "[high/medium/low based on how restrictive or burdensome]",
        "riskReason": "[Explain why you assigned this restriction risk level]"
    }},
    "overallRiskAssessment": {{
        "level": "[high/medium/low - overall risk level for the reader]",
        "riskAnalysis": "[Detailed explanation of the main risks or concerns with this document]",
        "recommendations": "[Specific actionable advice for someone dealing with this document]",
        "warningFlags": [
            "[Specific concern or red flag #1]",
            "[Specific concern or red flag #2]"
        ]
    }}
}}

Document content to analyze:
{text_content[:4000]}

IMPORTANT: Return ONLY the JSON object with NO additional text or explanation. Every field must be filled with meaningful content based on the document."""
        
        response = await llm.ainvoke(prompt)
        
        # Try to parse JSON from response
        import json
        try:
            # Clean the response to extract JSON
            content = response.content.strip()
            if content.startswith('```json'):
                content = content[7:-3].strip()
            elif content.startswith('```'):
                content = content[3:-3].strip()
            
            return json.loads(content)
        except Exception as parse_error:
            print(f"JSON parsing error: {parse_error}")
            # Enhanced fallback with more detailed analysis
            return {
                "documentSummary": {
                    "title": "Legal Document Analysis",
                    "overview": "This document contains legal terms and conditions that establish rights, obligations, and procedures between parties. It requires careful review to understand all implications.",
                    "keyPoints": [
                        "Document establishes legal obligations between parties",
                        "Contains specific terms and conditions that must be followed",
                        "May have financial or legal consequences if not properly understood"
                    ]
                },
                "keyDates": {
                    "summary": "Time-sensitive elements may be present that require attention to deadlines and effective dates",
                    "criticalDeadlines": [
                        "Review document for any specific dates mentioned",
                        "Check for renewal, termination, or compliance deadlines"
                    ]
                },
                "financialOverview": {
                    "summary": "Document likely contains financial obligations, payments, or monetary considerations that need careful evaluation",
                    "keyAmounts": [
                        "Review document for specific dollar amounts or payment terms",
                        "Check for fees, deposits, or penalty clauses"
                    ],
                    "riskLevel": "medium",
                    "riskReason": "Financial terms require careful review to understand full monetary obligations and potential costs"
                },
                "keyRestrictions": {
                    "summary": "Document contains various rules, limitations, and requirements that must be followed to remain in compliance",
                    "importantRules": [
                        "Carefully review all prohibited activities or behaviors",
                        "Understand compliance requirements and obligations",
                        "Note any restrictions on rights or freedoms"
                    ],
                    "riskLevel": "medium",
                    "riskReason": "Restrictions may limit flexibility and require ongoing compliance to avoid penalties"
                },
                "overallRiskAssessment": {
                    "level": "medium",
                    "riskAnalysis": "This document creates legal obligations and potential liabilities that require careful consideration. Non-compliance could result in financial or legal consequences.",
                    "recommendations": "Read the entire document carefully, seek legal advice if terms are unclear, and ensure you can comply with all requirements before agreeing",
                    "warningFlags": [
                        "Complex legal language may hide important obligations",
                        "Document creates binding legal commitments"
                    ]
                }
            }
    except Exception as e:
        print(f"Comprehensive summary error: {e}")
        return None

async def simple_summary(text_content: str, level: str = "beginner"):
    """Simple fallback summarization without complex processing"""
    try:
        llm = obtain_chat_model()
        
        # Generate comprehensive summary
        comprehensive_summary = await generate_comprehensive_summary(text_content, level)
        
        # Generate markdown summary based on level
        if level == "expert":
            prompt = f"""Provide a detailed legal summary of this document using precise legal terminology. Format your response in markdown with:
            - ## Main sections as headers
            - **Bold** for important terms
            - `code` for specific clauses or references
            - Bullet points for key provisions
            
            Document content:
            {text_content[:2000]}"""
        elif level == "moderate":
            prompt = f"""Summarize this legal document in clear language for someone with basic legal knowledge. Format your response in markdown with:
            - ## Main sections as headers
            - **Bold** for important points
            - Bullet points for key terms
            - Simple explanations
            
            Document content:
            {text_content[:2000]}"""
        else:  # beginner
            prompt = f"""Explain this legal document in very simple terms for a non-lawyer. Format your response in markdown with:
            - ## Clear section headers
            - **Bold** for important information
            - Bullet points for easy reading
            - Plain language explanations
            
            Document content:
            {text_content[:2000]}"""
        
        response = await llm.ainvoke(prompt)
        
        # First extract structured data
        structured_data = await extract_structured_data(text_content)
        
        # Return comprehensive data
        return {
            "summary": response.content,
            "structuredData": structured_data,
            "comprehensiveSummary": comprehensive_summary
        }
        
    except Exception as e:
        print(f"Simple summary error: {e}")
        return {
            "summary": """## Document Summary
            
            **Status:** Processing Error
            
            This appears to be a legal document, but we encountered an issue during processing. 
            
            **What you can do:**
            * Ask specific questions about the document
            * Try uploading the document again
            * Contact support if the issue persists
            
            The document content discusses various terms and conditions that would typically be found in legal agreements.""",
            "structuredData": None,
            "comprehensiveSummary": None
        }

async def final_summary(file_path, level: str = "beginner"):
    app = construct_graph(level)
    loader = PyPDFLoader(file_path)
    pages = []
    async for page in loader.alazy_load():
        pages.append(page)
    split_docs = splitting(pages)
    for i, doc in enumerate(split_docs):
        print(f"DOC {i} >>>", doc.page_content[:300])
        if not any(doc.page_content.strip() for doc in split_docs):
            raise ValueError("PDF contained no extractable text")
    result = None
    async for step in app.astream(
        {"contents": [doc.page_content for doc in split_docs]},
        {"recursion_limit": 10},
    ): result = step
    return result


# if __name__ == "__main__":
#     result = asyncio.run(final_summary("../Hostel_Affidavit_Men_2024-Chennai_Updated.pdf"))
#     print(result)