import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Chat } from './components/Chat';
import { 
  getDocuments, 
  uploadDocument, 
  deleteDocument, 
  queryKnowledgeBase, 
  Document, 
  QueryResponse 
} from './api/client';
import { Loader2, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoadingDocs(true);
      const docs = await getDocuments();
      setDocuments(docs);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      // Fallback data for demonstration if backend is not reachable
      const mockDocs: Document[] = [
        { id: '1', name: 'Q4_Retail_Performance.pdf', size: 1024 * 1024 * 2.5, uploadDate: new Date().toISOString(), status: 'ready' },
        { id: '2', name: 'Inventory_Policy_2024.docx', size: 1024 * 512, uploadDate: new Date().toISOString(), status: 'processing' },
      ];
      setDocuments(mockDocs);
      setError('Backend not connected (127.0.0.1:8000). Using preview data.');
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    // Refresh document status periodically
    const interval = setInterval(fetchDocuments, 10000);
    return () => clearInterval(interval);
  }, [fetchDocuments]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      await uploadDocument(file);
      await fetchDocuments();
    } catch (err) {
      setError('Failed to upload document. Please check the backend connection.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (err) {
      setError('Failed to delete document.');
    }
  };

  const handleSendMessage = async (query: string): Promise<QueryResponse> => {
    setIsThinking(true);
    setError(null);
    try {
      const response = await queryKnowledgeBase(query);
      return response;
    } catch (err) {
      // Simulate response if backend fails for demonstration
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            answer: "The RAG system is ready but the backend connection at http://127.0.0.1:8000 is not responding. Ensure your FastAPI server is running with CORS enabled.",
            sources: [
              { documentName: 'System Diagnostic', content: 'Connection refused: Check local server status.' }
            ]
          });
        }, 1500);
      });
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-900 font-sans selection:bg-indigo-100">
      <Sidebar 
        documents={documents} 
        onUpload={handleUpload} 
        onDelete={handleDelete}
        onRefresh={fetchDocuments}
        isUploading={isUploading}
      />
      
      <main className="flex-1 relative flex flex-col min-w-0 h-full">
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-semibold shadow-xl">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              {error}
              <button 
                onClick={() => setError(null)}
                className="ml-2 hover:text-amber-600 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {isLoadingDocs && documents.length === 0 ? (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Initializing Workspace...</p>
            </div>
          </div>
        ) : (
          <Chat 
            onSendMessage={handleSendMessage} 
            isThinking={isThinking} 
          />
        )}
      </main>
    </div>
  );
};

export default App;