import requests
import json

class LegalBotClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
    
    def summarize_text(self, text_content, level="beginner", document_id=None):
        """
        Send extracted text to Python server for summarization
        
        Args:
            text_content: Extracted text from your document
            level: "expert", "moderate", or "beginner"
            document_id: MongoDB document ID (optional)
        """
        url = f"{self.base_url}/summarize-text"
        payload = {
            "text": text_content,
            "level": level,
            "document_id": document_id
        }
        
        response = requests.post(url, json=payload)
        return response.json()
    
    def ask_question(self, question):
        """Ask question about the summarized document"""
        url = f"{self.base_url}/ask"
        response = requests.post(url, data={"question": question})
        return response.json()

# Example usage for your backend integration
def integrate_with_your_backend():
    client = LegalBotClient()
    
    # Example: Text extracted from your MongoDB document
    extracted_text = """
    This is a legal document about rental agreements.
    The tenant agrees to pay monthly rent of $1000.
    The lease term is 12 months starting January 1, 2024.
    """
    
    # Send to Python server for summarization
    summary_response = client.summarize_text(
        text_content=extracted_text,
        level="beginner",  # or "moderate", "expert"
        document_id="mongodb_doc_id_123"
    )
    
    print("Summary Response:", summary_response)
    
    # Ask questions about the document
    qa_response = client.ask_question("What is the monthly rent?")
    print("Q&A Response:", qa_response)
    
    return summary_response

if __name__ == "__main__":
    integrate_with_your_backend()