from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from .summarization import final_summary_from_text
from .qna import init_chat_from_text
import shutil
import os
from pydantic import BaseModel

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4000",
        "https://genai-hackathon-host.onrender.com",
        "http://localhost:5173",
        "https://gen-ai-hackathon-host.vercel.app",
        "https://gen-ai-hackathon-host-a4u7.vercel.app",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to store chatbot
GRAPH = None
BOT = None
CURRENT_TEXT = None

class TextSummaryRequest(BaseModel):
    text: str
    level: str = "beginner"  # expert, moderate, beginner
    document_id: str = None  # MongoDB document ID


@app.post("/summarize-text")
async def summarize_text(request: TextSummaryRequest):
    global BOT, GRAPH, CURRENT_TEXT
    
    CURRENT_TEXT = request.text
    
    # Generate summary from text
    summary_result = await final_summary_from_text(request.text, request.level)
    
    # Initialize chatbot for Q&A
    BOT, GRAPH = await init_chat_from_text(request.text)
    
    # Handle both old string format and new object format
    if isinstance(summary_result, dict):
        return {
            "summary": summary_result.get("summary", "Summary not available"),
            "structuredData": summary_result.get("structuredData"),
            "comprehensiveSummary": summary_result.get("comprehensiveSummary"),
            "document_id": request.document_id,
            "level": request.level,
            "message": "Text summarized and bot ready!"
        }
    else:
        return {
            "summary": summary_result,
            "structuredData": None,
            "comprehensiveSummary": None,
            "document_id": request.document_id,
            "level": request.level,
            "message": "Text summarized and bot ready!"
        }

@app.post("/summarize")
async def summarize_and_store(file: UploadFile = File(...)):
    global BOT, GRAPH, CURRENT_TEXT
    # Save the uploaded PDF temporarily
    file_path = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text from PDF
    from langchain_community.document_loaders import PyPDFLoader
    loader = PyPDFLoader(file_path)
    pages = []
    async for page in loader.alazy_load():
        pages.append(page)
    
    text_content = "\n\n".join([page.page_content for page in pages])
    CURRENT_TEXT = text_content

    # Generate summary
    summary_result = await final_summary_from_text(text_content)

    # Initialize chatbot for Q&A
    BOT, GRAPH = await init_chat_from_text(text_content)

    return {"summary": summary_result, "message": "File summarized and bot ready!"}


@app.post("/ask")
async def ask_question(question: str = Form(...)):
    try:
        if not CURRENT_TEXT:
            return {"question": question, "answer": "No document loaded. Please upload a document first."}
        
        import google.generativeai as genai
        genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""Based on this document:
        {CURRENT_TEXT[:4000]}
        
        Question: {question}
        
        Answer based only on the document content:"""
        
        response = model.generate_content(prompt)
        return {"question": question, "answer": response.text}
        
    except Exception as e:
        return {"question": question, "answer": f"Error: {str(e)}"}
