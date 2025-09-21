#!/bin/bash

echo "Setting up Legal Document AI Assistant..."

# Backend setup
echo "Installing backend dependencies..."
cd backend
npm install axios

# Frontend setup (if needed)
echo "Frontend dependencies should already be installed..."

# Python AI server setup
echo "Setting up Python AI server..."
cd ../GoogleAI_Legalbot-qna-backend
pip install -r requirements.txt

echo "Setup complete!"
echo ""
echo "To run the application:"
echo "1. Start Python AI server: cd GoogleAI_Legalbot-qna-backend/AI && python -m uvicorn api:app --reload --port 8000"
echo "2. Start backend: cd backend && npm run dev"
echo "3. Start frontend: cd frontend && npm run dev"
echo ""
echo "Make sure to:"
echo "- Set GOOGLE_API_KEY in GoogleAI_Legalbot-qna-backend/.env"
echo "- Install and run Ollama with: ollama pull nomic-embed-text:latest"