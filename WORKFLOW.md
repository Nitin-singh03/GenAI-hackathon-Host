# Legal Document AI Assistant - Complete Workflow

## 🔐 Authentication Flow
1. **User Registration/Login**
   - Beautiful gradient design with icons
   - JWT token storage in localStorage
   - Automatic redirect to main app

## 📄 Document Processing Workflow

### Step 1: File Upload
- **Supported formats**: PDF, DOC, DOCX (up to 10MB)
- **UI Features**: 
  - Drag & drop interface
  - Progress indicators
  - Loading animations
- **Backend Processing**:
  - Text extraction using pdf-parse (PDF) or mammoth (DOC/DOCX)
  - Document saved to MongoDB with user ID

### Step 2: AI Processing
- **Automatic AI Summarization**: All 3 levels generated simultaneously
  - Beginner: Simple, plain language
  - Moderate: Balanced technical and accessible
  - Expert: Full legal terminology
- **Python AI Server**: 
  - Uses Google Gemini 2.5 Flash
  - Ollama embeddings for Q&A
  - LangChain/LangGraph for processing

### Step 3: Database Storage
- **MongoDB Document Schema**:
  ```javascript
  {
    userId: ObjectId,
    filename: String,
    content: String,        // Extracted text
    summaries: {
      beginner: String,
      moderate: String,
      expert: String
    },
    isProcessed: Boolean,
    timestamps: true
  }
  ```

### Step 4: Frontend Display
- **Document Viewer**: Shows summary based on selected complexity
- **Interactive Chat**: Q&A about the document
- **Complexity Switching**: Instant switching between cached summaries

## 🔄 Complete Data Flow

```
User Login → Upload Document → Extract Text → Send to Python AI → 
Generate 3 Summaries → Save to MongoDB → Display in Frontend → 
Interactive Q&A Ready
```

## 🚀 How to Run

### 1. Start Python AI Server
```bash
cd GoogleAI_Legalbot-qna-backend/AI
python -m uvicorn api:app --reload --port 8000
```

### 2. Start Backend
```bash
cd backend
npm run dev  # Port 4000
```

### 3. Start Frontend
```bash
cd frontend
npm run dev  # Port 5173
```

## 📋 Required Setup
- ✅ Google AI API key in `.env`
- ✅ Ollama with nomic-embed-text model
- ✅ MongoDB running
- ✅ All dependencies installed

## 🎯 Key Features
- **Smart Caching**: All 3 summary levels cached after first generation
- **Real-time Q&A**: Interactive chat with document context
- **Professional UI**: Modern design with loading states
- **File Support**: PDF and Word documents
- **Security**: JWT authentication for all operations
- **Error Handling**: Graceful fallbacks and user feedback

## 🔧 API Endpoints

### Backend (Port 4000)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /upload` - Upload & process document
- `POST /summarize` - Get/generate summary for specific level
- `POST /ask` - Ask questions about document
- `GET /document/:id` - Get document details

### Python AI (Port 8000)
- `POST /summarize-text` - Generate summary from text
- `POST /ask` - Q&A with document context

The system provides a complete end-to-end solution for legal document analysis with AI-powered summarization and interactive Q&A capabilities!