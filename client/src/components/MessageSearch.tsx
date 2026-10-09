import React, { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Message } from '../lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageSearchProps {
  conversationId: string;
  onClose: () => void;
  onScrollToMessage: (messageId: string) => void;
}

export function MessageSearch({ conversationId, onClose, onScrollToMessage }: MessageSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const { data } = await supabase
        .from('messages')
        .select('*, sender:profiles(*)')
        .eq('conversation_id', conversationId)
        .ilike('content', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(20);
        
      setResults(data || []);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, conversationId]);

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="border-b border-slate-800 bg-slate-900 overflow-hidden"
    >
      <div className="p-3 border-b border-slate-800 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            autoFocus
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border-none rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-cyan-500 outline-none"
          />
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {searchTerm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-h-60 overflow-y-auto"
          >
            {isSearching ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-slate-800/50">
                {results.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => {
                      onScrollToMessage(msg.id);
                      onClose();
                    }}
                    className="w-full text-left p-3 hover:bg-slate-800 transition-colors flex flex-col gap-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-cyan-400">
                        {msg.sender?.display_name || 'User'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">
                      {/* Highlight match */}
                      {msg.content.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => 
                        part.toLowerCase() === searchTerm.toLowerCase() ? 
                          <span key={i} className="bg-cyan-500/30 text-cyan-200">{part}</span> : part
                      )}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">
                No messages found for "{searchTerm}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
