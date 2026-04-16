import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Info, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { cn } from '../utils/cn';
import { QueryResponse } from '../api/client';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: QueryResponse['sources'];
  timestamp: Date;
}

interface ChatProps {
  onSendMessage: (message: string) => Promise<QueryResponse>;
  isThinking: boolean;
}

export const Chat: React.FC<ChatProps> = ({ onSendMessage, isThinking }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');

    try {
      const response = await onSendMessage(currentInput);
      const assistantMessage: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please check the backend connection.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm z-10">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Document Intelligence Chat</h2>
          <p className="text-xs text-slate-500 font-medium">Grounded in uploaded documents only</p>
        </div>
        <div className="flex items-center gap-4">
          
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Clear conversation"
            >
              <Trash className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
              <Bot className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Welcome to Retail Intel</h3>
            <p className="text-slate-500">
              Upload documents in the sidebar to populate the knowledge base. Ask questions like:
            </p>
            <div className="grid grid-cols-2 gap-3 mt-8">
              {[
                "Summarize the retail performance report",
                "What are the inventory guidelines?",
                "Compare Q3 vs Q4 manual strategies",
                "Check compliance for supply chain",
              ].map((query) => (
                <button
                  key={query}
                  onClick={() => setInput(query)}
                  className="p-3 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex gap-4 max-w-4xl mx-auto",
                message.role === 'user' ? "flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                message.role === 'user' ? "bg-indigo-600" : "bg-white border border-slate-200"
              )}>
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-indigo-600" />
                )}
              </div>

              <div className={cn(
                "flex-1 space-y-2",
                message.role === 'user' ? "text-right" : ""
              )}>
                <div className={cn(
                  "inline-block p-4 rounded-2xl text-sm leading-relaxed shadow-sm text-left prose prose-sm max-w-none",
                  message.role === 'user'
                    ? "bg-indigo-600 text-white prose-invert"
                    : "bg-white border border-slate-200 text-slate-800"
                )}>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>

                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 justify-start">
                    <p className="w-full text-[11px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                      <Info className="w-3 h-3" /> Sources cited:
                    </p>
                    {message.sources.map((source, idx) => (
                      <div
                        key={idx}
                        className="group relative cursor-help px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] rounded border border-slate-200 transition-colors"
                        title={source.content}
                      >
                        {source.documentName} {source.page && `(p. ${source.page})`}
                        <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-900 text-white text-[11px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-20">
                          {source.content.length > 150 ? source.content.substring(0, 150) + '...' : source.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isThinking && (
          <div className="flex gap-4 max-w-4xl mx-auto animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-slate-200 rounded-full w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded-full w-1/2"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <footer className="p-6 bg-white border-t border-slate-200">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isThinking}
            placeholder="Ask a question about your documents..."
            className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 placeholder:text-slate-400 shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-md active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-medium">
          Retail Document Intelligence Suite v1.0 • Enterprise Edition
        </p>
      </footer>
    </div>
  );
};
