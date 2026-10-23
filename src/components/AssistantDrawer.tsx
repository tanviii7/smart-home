import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { AssistantChat } from './AssistantChat';

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onActionExecuted?: () => void;
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
  isOpen,
  onClose,
  onActionExecuted
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-nature-dark/30 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container (Desktop right panel / Mobile full bottom sheet) */}
      <div className="relative w-full sm:w-[480px] lg:w-[520px] h-full bg-nature-bg shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 border-l border-nature-border">
        {/* Top close bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-nature-surface border-b border-nature-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-nature-primary" />
            <span className="text-xs font-semibold text-nature-dark uppercase tracking-wider">
              Quick Assistant Panel
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-nature-sage/40 text-nature-muted hover:text-nature-text transition-colors"
            aria-label="Close assistant panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Assistant Chat Area */}
        <div className="flex-1 overflow-hidden">
          <AssistantChat onActionExecuted={onActionExecuted} />
        </div>
      </div>
    </div>
  );
};
