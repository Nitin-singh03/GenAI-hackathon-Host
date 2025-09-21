// Node.js/Express backend integration example
const axios = require('axios');

class LegalBotService {
    constructor(pythonServerUrl = 'http://localhost:8000') {
        this.pythonServerUrl = pythonServerUrl;
    }

    async summarizeDocument(textContent, level = 'beginner', documentId = null) {
        try {
            const response = await axios.post(`${this.pythonServerUrl}/summarize-text`, {
                text: textContent,
                level: level,
                document_id: documentId
            });
            
            return response.data;
        } catch (error) {
            console.error('Error summarizing document:', error);
            throw error;
        }
    }

    async askQuestion(question) {
        try {
            const response = await axios.post(`${this.pythonServerUrl}/ask`, 
                new URLSearchParams({ question: question }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            
            return response.data;
        } catch (error) {
            console.error('Error asking question:', error);
            throw error;
        }
    }
}

// Express route example
app.post('/api/documents/summarize', async (req, res) => {
    try {
        const { documentId, level = 'beginner' } = req.body;
        
        // Get document from MongoDB
        const document = await Document.findById(documentId);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        // Send extracted text to Python server
        const legalBot = new LegalBotService();
        const summaryResult = await legalBot.summarizeDocument(
            document.extractedText,
            level,
            documentId
        );
        
        // Save summary back to MongoDB
        document.summary = summaryResult.summary;
        document.summaryLevel = level;
        await document.save();
        
        // Return to frontend
        res.json({
            success: true,
            summary: summaryResult.summary,
            documentId: documentId,
            level: level
        });
        
    } catch (error) {
        console.error('Summarization error:', error);
        res.status(500).json({ error: 'Failed to summarize document' });
    }
});

app.post('/api/documents/ask', async (req, res) => {
    try {
        const { question } = req.body;
        
        const legalBot = new LegalBotService();
        const answer = await legalBot.askQuestion(question);
        
        res.json(answer);
        
    } catch (error) {
        console.error('Q&A error:', error);
        res.status(500).json({ error: 'Failed to get answer' });
    }
});

module.exports = LegalBotService;