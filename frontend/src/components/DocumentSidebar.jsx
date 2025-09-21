import React, { useState, useEffect } from 'react';
import { FileText, Clock, ChevronRight, Trash2 } from 'lucide-react';

function DocumentSidebar({ onDocumentSelect, selectedDocumentId, onDocumentDeleted }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/documents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (documentId, e) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this document and all its chat history?')) {
      return;
    }
    
    setDeletingId(documentId);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/document/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc._id !== documentId));
        if (selectedDocumentId === documentId) {
          onDocumentDeleted();
        }
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Document History
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {documents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No documents uploaded yet</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc._id}
              onClick={() => onDocumentSelect(doc)}
              className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedDocumentId === doc._id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate text-sm">
                    {doc.filename}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {formatDate(doc.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      doc.isProcessed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doc.isProcessed ? 'Processed' : 'Processing...'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => deleteDocument(doc._id, e)}
                    disabled={deletingId === doc._id}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete document"
                  >
                    {deletingId === doc._id ? (
                      <div className="w-3 h-3 border border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DocumentSidebar;