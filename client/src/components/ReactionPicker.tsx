import React from 'react';
import { motion } from 'framer-motion';

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  align: 'left' | 'right';
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏'];

export function ReactionPicker({ onSelect, onClose, align }: ReactionPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.15 }}
      className={`absolute z-50 flex gap-1 p-2 bg-slate-800 border border-slate-700 rounded-full shadow-lg ${
        align === 'right' ? 'right-0' : 'left-0'
      } -top-12`}
      onMouseLeave={onClose}
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(emoji);
          }}
          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-700 rounded-full transition-colors"
        >
          {emoji}
        </button>
      ))}
    </motion.div>
  );
}
