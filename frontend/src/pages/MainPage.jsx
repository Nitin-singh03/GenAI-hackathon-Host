import React, { useState } from 'react';
import DocumentViewer from '../components/DocumentViewer';
import ChatSection from '../components/ChatSection';
import PreferencesPanel from '../components/PreferencesPanel';
import DocumentSidebar from '../components/DocumentSidebar';
import { Upload, Settings } from 'lucide-react';

function MainPage() {
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Check authentication on component mount
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    } else {
      setIsAuthenticated(true);
    }
  }, []);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    complexityLevel: 'beginner',
    readAloudEnabled: true
  });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    step: 0,
    message: '',
    isProcessing: false
  });

  // Send file to backend
  const uploadToBackend = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      setUploadProgress({ step: 1, message: 'Extracting text from document...', isProcessing: true });
      
      const response = await fetch('https://genai-hackathon-host.onrender.com/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      setUploadProgress({ step: 2, message: 'Generating AI summaries...', isProcessing: true });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const summarizeDocument = async (documentId, level = 'beginner') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://genai-hackathon-host.onrender.com/summarize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ documentId, level }),
      });

      if (!response.ok) {
        throw new Error('Failed to summarize document');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error summarizing document:', error);
      return null;
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setLoading(true);
      setUploadProgress({ step: 1, message: 'Uploading document...', isProcessing: true });
      
      try {
        const uploadResponse = await uploadToBackend(file);

        if (uploadResponse?.documentId) {
          setCurrentDocumentId(uploadResponse.documentId);
          setUploadProgress({ step: 2, message: 'Text extracted! Click Generate Summary for AI analysis.', isProcessing: false });
          
          setUploadedDocument({
            name: file.name,
            type: file.type,
            size: file.size,
            documentId: uploadResponse.documentId,
            summaries: null,
            structuredData: null,
            needsSummary: true,
            content: {
              fullSummary: "Click 'Generate Summary' to analyze this document with AI.",
              language: "English",
              extractedText: uploadResponse.text
            }
          });
        }
      } catch (error) {
        setUploadProgress({ step: 0, message: 'Upload failed. Please try again.', isProcessing: false });
        console.error('Upload error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      handleFileUpload({ target: { files: [file] } });
    }
  };

  const handleDocumentDeleted = () => {
    setUploadedDocument(null);
    setCurrentDocumentId(null);
    setSelectedDocument(null);
  };

  const handleDocumentSelect = async (document) => {
    setSelectedDocument(document);
    setCurrentDocumentId(document._id);
    
    // Load document details
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://genai-hackathon-host.onrender.com/document/${document._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const docData = await response.json();
        const currentSummary = docData.summaries 
          ? docData.summaries[preferences.complexityLevel]
          : 'Summary not available';
        
        setUploadedDocument({
          name: docData.filename,
          type: 'application/pdf',
          size: 0,
          documentId: docData._id,
          summaries: docData.summaries,
          structuredData: docData.structuredData,
          comprehensiveSummary: docData.comprehensiveSummary,
          content: {
            fullSummary: currentSummary,
            language: "English",
            extractedText: docData.content
          }
        });
      }
    } catch (error) {
      console.error('Error loading document:', error);
    }
  };

  const generateSummary = async () => {
    if (!currentDocumentId) return;
    
    setLoading(true);
    setUploadProgress({ step: 1, message: 'Generating AI summary...', isProcessing: true });
    
    try {
      const summaryResponse = await summarizeDocument(currentDocumentId, preferences.complexityLevel);
      
      if (summaryResponse?.summary) {
        setUploadedDocument(prev => ({
          ...prev,
          summaries: { [preferences.complexityLevel]: summaryResponse.summary },
          structuredData: summaryResponse.structuredData,
          comprehensiveSummary: summaryResponse.comprehensiveSummary,
          needsSummary: false,
          content: {
            ...prev.content,
            fullSummary: summaryResponse.summary
          }
        }));
        setUploadProgress({ step: 2, message: 'AI analysis complete!', isProcessing: false });
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setUploadProgress({ step: 0, message: 'Summary generation failed. Please try again.', isProcessing: false });
    } finally {
      setLoading(false);
    }
  };

  const handleComplexityChange = async (newLevel) => {
    setPreferences(prev => ({ ...prev, complexityLevel: newLevel }));
    
    if (uploadedDocument?.summaries) {
      // Use cached summary if available
      const cachedSummary = uploadedDocument.summaries[newLevel];
      if (cachedSummary) {
        setUploadedDocument(prev => ({
          ...prev,
          content: {
            ...prev.content,
            fullSummary: cachedSummary
          }
        }));
        return;
      }
    }
    
    // Fallback: request from backend if not cached
    if (currentDocumentId) {
      setLoading(true);
      const summaryResponse = await summarizeDocument(currentDocumentId, newLevel);
      
      if (summaryResponse?.summary) {
        setUploadedDocument(prev => ({
          ...prev,
          summaries: {
            ...prev.summaries,
            [newLevel]: summaryResponse.summary
          },
          structuredData: summaryResponse.structuredData || prev.structuredData,
          comprehensiveSummary: summaryResponse.comprehensiveSummary || prev.comprehensiveSummary,
          content: {
            ...prev.content,
            fullSummary: summaryResponse.summary
          }
        }));
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DocumentSidebar 
        onDocumentSelect={handleDocumentSelect}
        selectedDocumentId={currentDocumentId}
        onDocumentDeleted={handleDocumentDeleted}
      />
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Simplifier</h1>
            <p className="text-gray-600 mt-1">Upload and analyze your legal documents</p>
          </div>
          <button
            onClick={() => setIsPreferencesOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <Settings className="w-4 h-4" />
            Preferences
          </button>
        </div>

        {!uploadedDocument ? (
          /* File Upload Section */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            {loading ? (
              /* Loading State */
              <div className="p-12">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {uploadProgress.message}
                </h3>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${(uploadProgress.step / 2) * 100}%` }}
                  ></div>
                </div>
                <p className="text-gray-600 text-sm">
                  Step {uploadProgress.step} of 2: Processing your document with AI
                </p>
              </div>
            ) : (
              /* Upload Interface */
              <div
                className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg p-12 transition-colors duration-200 cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Upload Your Legal Document
                </h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop your PDF or Word file here, or click to browse
                </p>
                <div className="text-sm text-gray-500">
                  Supports PDF, DOC, DOCX files up to 10MB
                </div>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>
        ) : (
          /* Document Analysis View */
          <div className="grid lg:grid-cols-2 gap-8">
            <DocumentViewer 
              document={uploadedDocument} 
              onGenerateSummary={generateSummary}
              loading={loading}
            />
            <ChatSection 
              document={uploadedDocument} 
              preferences={preferences}
            />
          </div>
        )}

        {/* Preferences Panel */}
        {isPreferencesOpen && (
          <PreferencesPanel
            preferences={preferences}
            setPreferences={setPreferences}
            onClose={() => setIsPreferencesOpen(false)}
            onComplexityChange={handleComplexityChange}
          />
        )}
      </div>
    </div>
  );
}

export default MainPage;