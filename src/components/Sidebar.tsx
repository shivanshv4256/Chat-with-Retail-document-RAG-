import React, { useRef } from 'react';
import { FileText, Plus, Trash2, Loader2, Database, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Document } from '../api/client';
import { cn } from '../utils/cn';

interface SidebarProps {
  documents: Document[];
  onUpload: (file: File) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  isUploading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ documents, onUpload, onDelete, onRefresh, isUploading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-80 h-full bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Database className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Retail Intel</h1>
        </div>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-lg transition-colors font-medium"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Upload Document
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.txt,.doc,.docx"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Documents</h2>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
            {documents.length}
          </span>
        </div>

        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700"
              >
                <FileText className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-slate-200">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500">{formatSize(doc.size)}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className={cn(
                      "text-[10px] flex items-center gap-1",
                      doc.status === 'ready' ? "text-emerald-400" : 
                      doc.status === 'error' ? "text-red-400" : "text-amber-400"
                    )}>
                      {doc.status === 'processing' && <Loader2 className="w-2 h-2 animate-spin" />}
                      {doc.status === 'error' && <AlertCircle className="w-2 h-2" />}
                      {doc.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(doc.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-700 rounded-md text-slate-400 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {documents.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-800 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No documents yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">System Status</p>
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Vector Engine Active
          </div>
        </div>
      </div>
    </div>
  );
};
