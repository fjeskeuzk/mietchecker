'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatProps {
  projectId: string;
}

export function Chat({ projectId }: ChatProps) {
  const t = useTranslations();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/chat`);
        if (response.ok) {
          const data = await response.json();
          const loadedMessages: Message[] = data.conversations.map((conv: any) => ({
            id: conv.id,
            role: conv.role,
            content: conv.message,
            timestamp: new Date(conv.created_at),
          }));
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [projectId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) {
      return;
    }

    // Store message before clearing input
    const messageToSend = inputValue.trim();

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Update user message with database ID
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id
            ? { ...msg, id: data.userMessage.id, timestamp: new Date(data.userMessage.created_at) }
            : msg
        )
      );

      // Add assistant message with database ID
      const assistantMessage: Message = {
        id: data.assistantMessage.id,
        role: 'assistant',
        content: data.assistantMessage.message,
        timestamp: new Date(data.assistantMessage.created_at),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Sind Sie sicher, dass Sie den Chat-Verlauf löschen möchten?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessages([]);
      } else {
        console.error('Failed to clear chat history');
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  return (
    <div className="flex flex-col h-96 gap-4">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-secondary/10 rounded-lg">
        {isLoadingHistory ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-2">
              {t('chat.noMessages')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('chat.startConversation')}
            </p>

            {/* Example Questions */}
            <div className="mt-6 space-y-2 text-left">
              <p className="text-xs font-semibold text-muted-foreground">
                {t('chat.exampleQuestions')}
              </p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• {t('chat.example1')}</li>
                <li>• {t('chat.example2')}</li>
                <li>• {t('chat.example3')}</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 animate-fadeIn ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-secondary text-secondary-foreground rounded-bl-none'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="text-sm markdown-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ ...props }) => <h1 className="text-lg font-bold mb-2 mt-3" {...props} />,
                          h2: ({ ...props }) => <h2 className="text-base font-bold mb-2 mt-3" {...props} />,
                          h3: ({ ...props }) => <h3 className="text-sm font-bold mb-1 mt-2" {...props} />,
                          p: ({ ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
                          ul: ({ ...props }) => <ul className="mb-2 ml-4 space-y-1" {...props} />,
                          ol: ({ ...props }) => <ol className="mb-2 ml-4 space-y-1 list-decimal" {...props} />,
                          li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
                          strong: ({ ...props }) => <strong className="font-bold text-foreground" {...props} />,
                          em: ({ ...props }) => <em className="italic" {...props} />,
                          code: ({ ...props }) => (
                            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props} />
                          ),
                          pre: ({ ...props }) => (
                            <pre className="bg-muted p-2 rounded my-2 overflow-x-auto" {...props} />
                          ),
                          a: ({ ...props }) => (
                            <a className="text-primary underline hover:text-primary/80" {...props} />
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{t('common.loading')}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="space-y-2">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder={t('chat.placeholder')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {t('chat.send')}
          </Button>
        </form>

        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            className="w-full"
          >
            {t('chat.clear')}
          </Button>
        )}
      </div>
    </div>
  );
}
