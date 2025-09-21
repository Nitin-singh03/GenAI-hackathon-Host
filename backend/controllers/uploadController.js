const fs = require("fs");
const { PdfReader } = require("pdfreader");
const mammoth = require("mammoth");
const axios = require("axios");
const documentModel = require("../models/documentModel.js");

const PYTHON_AI_SERVER = process.env.PYTHON_AI_SERVER || 'https://legal-ai-python.onrender.com';

const extractPdfText = (buffer) => {
  return new Promise((resolve, reject) => {
    let text = '';
    new PdfReader().parseBuffer(buffer, (err, item) => {
      if (err) {
        reject(err);
      } else if (!item) {
        resolve(text || 'PDF content extracted successfully');
      } else if (item.text) {
        text += item.text + ' ';
      }
    });
  });
};

const extractTextFromFile = async (filePath, mimeType) => {
  const dataBuffer = fs.readFileSync(filePath);
  
  if (mimeType === 'application/pdf') {
    try {
      const text = await extractPdfText(dataBuffer);
      return text;
    } catch (pdfError) {
      console.error('PDF parsing failed:', pdfError.message);
      throw new Error('PDF file is corrupted or cannot be parsed. Please try a different PDF file.');
    }
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
             mimeType === 'application/msword') {
    try {
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      return result.value;
    } catch (docError) {
      console.error('DOC parsing failed:', docError.message);
      throw new Error('Word document cannot be parsed. Please try a different file.');
    }
  } else {
    throw new Error('Unsupported file type. Please upload PDF, DOC, or DOCX files.');
  }
};

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);

    const newDocument = new documentModel({
      userId: req.user.id,
      filename: req.file.originalname,
      content: extractedText,
    });

    await newDocument.save();

    // Generate all three summary levels
    try {
      const summaries = {};
      const levels = ['beginner', 'moderate', 'expert'];
      
      for (const level of levels) {
        const aiResponse = await axios.post(`${PYTHON_AI_SERVER}/summarize-text`, {
          text: extractedText,
          level: level,
          document_id: newDocument._id
        });
        summaries[level] = aiResponse.data.summary;
      }
      
      // Update document with all summaries
      newDocument.summaries = summaries;
      newDocument.isProcessed = true;
      await newDocument.save();
      
      res.json({
        message: "File processed and summarized successfully",
        text: extractedText,
        documentId: newDocument._id,
        summaries: summaries
      });
    } catch (aiError) {
      console.error('AI processing error:', aiError);
      res.json({
        message: "File uploaded but AI processing failed",
        text: extractedText,
        documentId: newDocument._id,
        summaries: null
      });
    }

    fs.unlinkSync(req.file.path);
  } catch (err) {
    console.error("Error processing document:", err);
    res.status(500).json({ message: "Error parsing document" });
  }
};

const summarizeDocument = async (req, res) => {
  try {
    const { documentId, level = 'beginner' } = req.body;
    
    const document = await documentModel.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Check if summary already exists for this level
    if (document.summaries && document.summaries[level]) {
      return res.json({
        success: true,
        summary: document.summaries[level],
        structuredData: document.structuredData,
        documentId: documentId,
        level: level,
        cached: true
      });
    }
    
    // Generate new summary
    const aiResponse = await axios.post(`${PYTHON_AI_SERVER}/summarize-text`, {
      text: document.content,
      level: level,
      document_id: documentId
    });
    
    // Update document with new summary and structured data
    if (!document.summaries) document.summaries = {};
    
    let summaryText = '';
    let structuredData = null;
    
    console.log('AI Response:', aiResponse.data);
    
    // Handle the response from Python server
    if (typeof aiResponse.data === 'string') {
      // Try to parse if it's a JSON string
      try {
        const parsed = JSON.parse(aiResponse.data);
        summaryText = parsed.summary || aiResponse.data;
        structuredData = parsed.structuredData;
        if (parsed.comprehensiveSummary) {
          document.comprehensiveSummary = parsed.comprehensiveSummary;
        }
      } catch {
        summaryText = aiResponse.data;
      }
    } else if (aiResponse.data && typeof aiResponse.data === 'object') {
      summaryText = aiResponse.data.summary || 'Summary not available';
      structuredData = aiResponse.data.structuredData;
      if (aiResponse.data.comprehensiveSummary) {
        document.comprehensiveSummary = aiResponse.data.comprehensiveSummary;
      }
    } else {
      summaryText = 'Summary generation failed';
    }
    
    // Ensure summaryText is always a string
    if (typeof summaryText !== 'string') {
      summaryText = JSON.stringify(summaryText);
    }
    
    document.summaries[level] = summaryText;
    
    // Store structured data if available
    if (structuredData) {
      document.structuredData = structuredData;
    }
    
    document.isProcessed = true;
    await document.save();
    
    res.json({
      success: true,
      summary: summaryText,
      structuredData: structuredData || document.structuredData,
      comprehensiveSummary: document.comprehensiveSummary,
      documentId: documentId,
      level: level,
      cached: false
    });
    
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({ error: 'Failed to summarize document' });
  }
};

const askQuestion = async (req, res) => {
  try {
    const { question, documentId } = req.body;
    
    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }
    
    // Get document content
    const document = await documentModel.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Send question with document context to Python server
    const contextualQuestion = `Based on this document content: "${document.content.substring(0, 2000)}...", please answer: ${question}`;
    
    const aiResponse = await axios.post(`${PYTHON_AI_SERVER}/ask`, 
      new URLSearchParams({ question: contextualQuestion }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    
    // Save chat to database
    const chatModel = require('../models/chatModel.js');
    let chat = await chatModel.findOne({ userId: req.user.id, documentId });
    
    if (!chat) {
      chat = new chatModel({ userId: req.user.id, documentId, messages: [] });
    }
    
    const answer = aiResponse.data.answer || 'Sorry, I could not generate an answer.';
    
    chat.messages.push(
      { type: 'user', content: question },
      { type: 'ai', content: answer }
    );
    
    await chat.save();
    
    res.json({ answer });
    
  } catch (error) {
    console.error('Q&A error:', error);
    res.status(500).json({ error: 'Failed to get answer: ' + error.message });
  }
};

const getUserDocuments = async (req, res) => {
  try {
    const documents = await documentModel.find({ userId: req.user.id })
      .select('filename summaries isProcessed createdAt')
      .sort({ createdAt: -1 });
    
    res.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { documentId } = req.params;
    const chatModel = require('../models/chatModel.js');
    
    const chat = await chatModel.findOne({ userId: req.user.id, documentId });
    
    res.json({ messages: chat ? chat.messages : [] });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const chatModel = require('../models/chatModel.js');
    
    // Delete document
    await documentModel.findOneAndDelete({ _id: documentId, userId: req.user.id });
    
    // Delete associated chat
    await chatModel.findOneAndDelete({ userId: req.user.id, documentId });
    
    res.json({ message: 'Document and chat history deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

const getDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = await documentModel.findById(documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

module.exports = { uploadDocument, summarizeDocument, askQuestion, getDocument, getUserDocuments, getChatHistory, deleteDocument };