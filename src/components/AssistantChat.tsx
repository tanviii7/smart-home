import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  X
} from 'lucide-react';
import { AssistantMessage } from '../types';
import { AssistantService } from '../services/assistantService';
import { StorageRepository } from '../services/storage';
import { useToast } from '../context/ToastContext';

interface AssistantChatProps {
  onActionExecuted?: () => void;
  isFullPage?: boolean;
}

const SUGGESTED_PROMPTS = [
  'Turn off all the living room lights',
  'Plan my dinners for the next five days',
  'Add milk and bread to my grocery list',
  'What tasks are due today?',
  'Create a relaxing evening scene',
  'Activate Movie Night',
  'Help me organize my home for the weekend'
];

export const AssistantChat: React.FC<AssistantChatProps> = ({
  onActionExecuted,
  isFullPage = false
}) => {
  const [messages, setMessages] = useState<AssistantMessage[]>(() =>
    StorageRepository.getChatMessages()
  );
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isThinking) return;

    const userMessage: AssistantMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    StorageRepository.saveChatMessages(newHistory);
    setInput('');
    setIsThinking(true);

    try {
      const response = await AssistantService.processUserMessage(text);
      const updatedHistory = [...newHistory, response];
      setMessages(updatedHistory);
      StorageRepository.saveChatMessages(updatedHistory);

      if (response.toolResults && response.toolResults.length > 0) {
        showToast('Assistant completed actions', 'success');
        onActionExecuted?.();
      }
    } catch (err: any) {
      console.error('Assistant error:', err);
      const errorMessage: AssistantMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'assistant',
        text: 'I ran into an issue processing that request. Please try again or rephrase.',
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleConfirmation = async (
    msg: AssistantMessage,
    confirmed: boolean
  ) => {
    if (!msg.confirmation?.actionPayload) return;

    setIsThinking(true);
    try {
      const response = await AssistantService.processUserMessage('', {
        confirmationResponse: confirmed,
        confirmedActionPayload: msg.confirmation.actionPayload
      });

      // Update confirmed state in historical message
      const updated = messages.map((m) =>
        m.id === msg.id
          ? {
              ...m,
              confirmation: {
                ...m.confirmation!,
                confirmed
              }
            }
          : m
      );

      const finalMessages = [...updated, response];
      setMessages(finalMessages);
      StorageRepository.saveChatMessages(finalMessages);

      if (confirmed) {
        showToast('Consequential action confirmed and executed', 'success');
        onActionExecuted?.();
      } else {
        showToast('Action cancelled', 'info');
      }
    } finally {
      setIsThinking(false);
    }
  };

  const handleResetChat = () => {
    StorageRepository.clearChatMessages();
    const initial: AssistantMessage[] = [
      {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: 'Hello! I am your Smart Home Assistant. What would you like to coordinate today?',
        timestamp: new Date().toISOString()
      }
    ];
    setMessages(initial);
    StorageRepository.saveChatMessages(initial);
    showToast('Conversation cleared', 'info');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col h-full bg-nature-bg ${isFullPage ? 'max-w-4xl mx-auto w-full' : ''}`}>
      {/* Header Info */}
      <div className="px-5 py-3.5 bg-nature-card border-b border-nature-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-nature-sage text-nature-dark flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-nature-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-base font-semibold text-nature-dark">
                Smart Home Assistant
              </h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border flex items-center gap-1 ${
                AssistantService.isApiEnabled()
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-nature-sage/60 text-nature-dark border-nature-border'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${AssistantService.isApiEnabled() ? 'bg-emerald-500 animate-pulse' : 'bg-nature-primary'}`} />
                {AssistantService.isApiEnabled() ? 'Gemini 3.8 Flash' : 'Local Intent Engine'}
              </span>
            </div>
            <p className="text-[11px] text-nature-muted">
              Validated tool execution across devices, meals & chores
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-nature-muted hover:text-nature-dark hover:bg-nature-sage/30 rounded-lg transition-colors"
          title="Start fresh conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* Message history */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-full bg-nature-sage text-nature-dark flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-nature-primary" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[78%] space-y-2`}>
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-nature-primary text-white rounded-br-xs shadow-soft'
                      : 'bg-nature-card text-nature-text border border-nature-border rounded-bl-xs shadow-soft'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Consequential action confirmation card */}
                  {msg.confirmation && msg.confirmation.required && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        <span>Confirmation Required: {msg.confirmation.title}</span>
                      </div>
                      <p>{msg.confirmation.prompt}</p>

                      {msg.confirmation.confirmed === undefined ? (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleConfirmation(msg, true)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-nature-primary text-white font-medium hover:bg-nature-primary-hover transition-colors shadow-soft"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Confirm Action
                          </button>
                          <button
                            onClick={() => handleConfirmation(msg, false)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-nature-card border border-nature-border text-nature-muted hover:text-nature-text transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="pt-1 font-medium text-[11px] text-nature-muted">
                          {msg.confirmation.confirmed
                            ? '✓ Confirmed by user'
                            : '✕ Cancelled by user'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tool execution audit trail */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-nature-border/60 space-y-1.5">
                      <div className="text-[11px] font-semibold text-nature-muted flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-nature-primary" />
                        <span>Tool Executions:</span>
                      </div>
                      <div className="space-y-1">
                        {msg.toolCalls.map((tc, idx) => {
                          const res = msg.toolResults?.[idx];
                          return (
                            <div
                              key={idx}
                              className="text-[11px] font-mono px-2 py-1 rounded bg-nature-sage-light border border-nature-border flex items-center justify-between gap-2"
                            >
                              <span className="truncate text-nature-dark">
                                {tc.name}({JSON.stringify(tc.params).slice(0, 35)}...)
                              </span>
                              {res ? (
                                <span
                                  className={`flex items-center gap-0.5 shrink-0 ${
                                    res.success ? 'text-emerald-700 font-semibold' : 'text-red-600'
                                  }`}
                                >
                                  {res.success ? <CheckCircle2 className="w-3 h-3" /> : 'Failed'}
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`text-[10px] text-nature-muted px-1 ${
                    isUser ? 'text-right' : 'text-left'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-full bg-nature-primary text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-7 h-7 rounded-full bg-nature-sage text-nature-dark flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-nature-primary animate-spin" />
            </div>
            <div className="bg-nature-card border border-nature-border px-4 py-3 rounded-2xl shadow-soft flex items-center gap-2">
              <span className="text-xs text-nature-muted font-medium">Assistant is thinking...</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-nature-primary animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-nature-primary animate-bounce delay-150"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-nature-primary animate-bounce delay-300"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      <div className="px-4 py-2 bg-nature-surface/50 border-t border-nature-border overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={isThinking}
            className="text-xs px-2.5 py-1 rounded-full bg-nature-card hover:bg-nature-sage/40 border border-nature-border text-nature-text font-medium transition-colors shrink-0 disabled:opacity-50"
          >
            "{prompt}"
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="p-3 sm:p-4 bg-nature-card border-t border-nature-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1 relative">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything, control devices, plan dinner, or update chores..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border focus:border-nature-primary focus:ring-1 focus:ring-nature-primary bg-nature-bg text-nature-text text-sm resize-none outline-none transition-all placeholder:text-nature-muted"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="h-11 px-4 rounded-xl bg-nature-primary hover:bg-nature-primary-hover disabled:opacity-40 text-white font-medium text-sm flex items-center justify-center gap-1.5 shadow-soft transition-all shrink-0 active:scale-95"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-nature-muted px-1">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>Alexa+ Inspired</span>
        </div>
      </div>
    </div>
  );
};
