import React, { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import ReadAloudButton from './ReadAloudButton';

function ChatSection({ document, preferences }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatLoaded, setChatLoaded] = useState(false);

  // Load chat history when document changes
  React.useEffect(() => {
    if (document?.documentId && !chatLoaded) {
      loadChatHistory(document.documentId);
    }
  }, [document?.documentId]);

  const loadChatHistory = async (documentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://genai-hackathon-host.onrender.com/chat/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages.map((msg, index) => ({
            id: index + 1,
            type: msg.type,
            content: msg.content,
            timestamp: new Date(msg.timestamp)
          })));
        } else {
          // Set welcome message if no chat history
          setMessages([{
            id: 1,
            type: 'ai',
            content: `Hello! I've analyzed your document "${document?.name || 'your document'}". I'm here to help you understand it better. Feel free to ask me any questions about the terms, conditions, or specific clauses.`,
            timestamp: new Date()
          }]);
        }
      }
      setChatLoaded(true);
    } catch (error) {
      console.error('Error loading chat history:', error);
      setChatLoaded(true);
    }
  };

  const askQuestion = async (question) => {
    if (!document?.documentId) {
      return 'Please select a document first.';
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://genai-hackathon-host.onrender.com/ask', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          question,
          documentId: document.documentId 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get answer');
      }

      const result = await response.json();
      return result.answer || 'Sorry, I could not generate an answer.';
    } catch (error) {
      console.error('Error asking question:', error);
      return `Sorry, there was an error: ${error.message}. Make sure the Python AI server is running on port 8000.`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuestion = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get AI response from backend
      const aiResponse = await askQuestion(currentQuestion);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-xl">
        <h2 className="text-xl font-bold text-gray-900">AI Assistant</h2>
        <p className="text-sm text-gray-600">
          Ask questions about your document • Complexity: {preferences.complexityLevel}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'ai' && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="leading-relaxed">{message.content}</p>
              {message.type === 'ai' && preferences.readAloudEnabled && (
                <div className="mt-2">
                  <ReadAloudButton text={message.content} />
                </div>
              )}
            </div>

            {message.type === 'user' && (
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your document..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatSection;