# Legal Document AI Assistant - Full Stack Integration

## Overview
Complete integration of frontend, backend, and Python AI server for legal document analysis with summarization and Q&A capabilities.

## Architecture
```
Frontend (React) → Backend (Node.js/Express) → Python AI Server (FastAPI) → Google Gemini AI
                      ↓
                  MongoDB (Document Storage)
```

## Features
- **File Upload**: PDF, DOC, DOCX support with text extraction
- **AI Summarization**: Multi-level complexity (beginner/moderate/expert)
- **Q&A Chat**: Interactive questions about uploaded documents
- **User Authentication**: JWT-based auth system
- **Document Management**: MongoDB storage with metadata

## Setup Instructions

### 1. Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- MongoDB
- Ollama (for embeddings)
- Google AI API key

### 2. Install Dependencies
```bash
# Run setup script
./setup.bat  # Windows
# or
./setup.sh   # Linux/Mac

# Or manually:
cd backend && npm install axios
cd ../GoogleAI_Legalbot-qna-backend && pip install -r requirements.txt
```

### 3. Environment Setup
Create `.env` in `GoogleAI_Legalbot-qna-backend/`:
```
GOOGLE_API_KEY=your_google_ai_api_key_here
```

### 4. Install Ollama
```bash
# Install Ollama from https://ollama.ai
ollama pull nomic-embed-text:latest
```

### 5. Start Services
```bash
# Terminal 1: Python AI Server
cd GoogleAI_Legalbot-qna-backend/AI
python -m uvicorn api:app --reload --port 8000

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: Frontend
cd frontend
npm run dev
```

## API Endpoints

### Backend (Port 4000)
- `POST /upload` - Upload document (PDF/DOC/DOCX)
- `POST /summarize` - Generate AI summary
- `POST /ask` - Ask questions about document
- `GET /document/:id` - Get document details

### Python AI Server (Port 8000)
- `POST /summarize-text` - Summarize text content
- `POST /ask` - Q&A about processed document

## Usage Flow

1. **Upload Document**: User uploads PDF/DOC file
2. **Text Extraction**: Backend extracts text using pdf-parse/mammoth
3. **Store in MongoDB**: Document and text saved to database
4. **AI Processing**: Text sent to Python server for summarization
5. **Display Results**: Summary shown to user
6. **Interactive Q&A**: User can ask questions about the document

## File Support
- **PDF**: Using pdf-parse
- **DOC/DOCX**: Using mammoth
- **Size Limit**: 10MB

## Complexity Levels
- **Beginner**: Simple, plain language explanations
- **Moderate**: Balanced technical and accessible language
- **Expert**: Full legal terminology and detailed analysis

## Database Schema
```javascript
Document {
  userId: ObjectId,
  filename: String,
  content: String,        // Extracted text
  summary: String,        // AI-generated summary
  summaryLevel: String,   // beginner/moderate/expert
  isProcessed: Boolean,
  timestamps: true
}
```

## Error Handling
- File upload validation
- AI server connectivity checks
- Graceful fallbacks for processing failures
- User-friendly error messages

## Security
- JWT authentication for all endpoints
- File type validation
- Size limits on uploads
- CORS configuration

## Development Notes
- Backend runs on port 4000
- Python AI server runs on port 8000
- Frontend runs on port 5173 (Vite default)
- MongoDB connection required for document storage