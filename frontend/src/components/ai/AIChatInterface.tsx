'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  useAIConversations, 
  useAIConversation, 
  useCreateConversation,
  useUpdateConversation,
  useDeleteConversation,
  useSendMessageInConversation,
  useUpdateMessage,
  useDeleteMessage,
  useAIUsage,
  type AIConversation,
  type AIMessage,
} from '@/hooks/useAI';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Card } from '@/components/UI/Card';
import { Modal } from '@/components/UI/Modal';
import { Progress } from '@/components/UI/Progress';
import { 
  Plus, 
  MessageSquare, 
  Bot, 
  Send, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Archive,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function AIChatInterface() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [message, setMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'conversation' | 'message'; id: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversationsData } = useAIConversations();
  const { data: conversationData } = useAIConversation(selectedConversationId);
  const { data: usageData } = useAIUsage();
  const createConversation = useCreateConversation();
  const updateConversation = useUpdateConversation();
  const deleteConversation = useDeleteConversation();
  const sendMessage = useSendMessageInConversation();
  const updateMessage = useUpdateMessage();
  const deleteMessage = useDeleteMessage();

  const conversations = (conversationsData?.data || []) as AIConversation[];
  const currentConversation = conversationData?.data as AIConversation | null;
  const messages = currentConversation?.messages || [];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateConversation = async () => {
    if (!newConversationTitle.trim()) {
      toast.error('Please enter a conversation title');
      return;
    }

    const result = await createConversation.mutateAsync({
      title: newConversationTitle,
      provider: 'gemini',
    });

    if (result.success) {
      setSelectedConversationId(result.data.id);
      setNewConversationTitle('');
      setShowNewConversation(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversationId) return;

    const messageText = message;
    setMessage('');

    await sendMessage.mutateAsync({
      conversationId: selectedConversationId,
      message: messageText,
    });
  };

  const handleEditMessage = async () => {
    if (!editingMessageId || !editingContent.trim()) return;

    await updateMessage.mutateAsync({
      messageId: editingMessageId,
      content: editingContent,
    });

    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleDeleteMessage = async (messageId: string) => {
    await deleteMessage.mutateAsync(messageId);
    setShowDeleteConfirm(null);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    await deleteConversation.mutateAsync(conversationId);
    setShowDeleteConfirm(null);
    if (selectedConversationId === conversationId) {
      setSelectedConversationId(null);
    }
  };

  const formatMessage = (text: string) => {
    let formatted = text;
    formatted = formatted.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-ink mt-4 mb-2">$1</h3>');
    formatted = formatted.replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-ink mt-5 mb-3">$1</h2>');
    formatted = formatted.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-ink mt-6 mb-4">$1</h1>');
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-ink">$1</strong>');
    formatted = formatted.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
    formatted = formatted.replace(/^\* (.+)$/gm, '<li class="ml-4 mb-1">• $1</li>');
    formatted = formatted.replace(/(<li.*<\/li>\n?)+/g, '<ul class="my-2 space-y-1">$&</ul>');
    formatted = formatted.replace(/^---$/gm, '<hr class="my-4 border-border" />');
    formatted = formatted.replace(/\n\n/g, '<br/><br/>');
    formatted = formatted.replace(/\n/g, '<br/>');
    return formatted;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-12rem)]">
      {/* Sidebar - Conversations List */}
      <Card className="lg:col-span-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border">
          <Button 
            size="sm" 
            className="w-full" 
            onClick={() => setShowNewConversation(true)}
            disabled={createConversation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Conversation
          </Button>

          {/* Usage Stats */}
          {usageData && (
            <div className="mt-4 space-y-2">
              <div className="text-xs text-ink-muted">
                <div className="flex justify-between mb-1">
                  <span>Messages</span>
                  <span>{usageData.current.messages}/{usageData.limits.messages}</span>
                </div>
                <Progress value={usageData.percentage.messages} size="sm" />
              </div>
              <div className="text-xs text-ink-muted">
                <div className="flex justify-between mb-1">
                  <span>Conversations</span>
                  <span>{usageData.current.conversations}/{usageData.limits.conversations}</span>
                </div>
                <Progress value={usageData.percentage.conversations} size="sm" />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-ink-muted text-sm">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No conversations yet
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    selectedConversationId === conv.id
                      ? 'bg-brand/10 border border-brand/20'
                      : 'hover:bg-bg-muted border border-transparent'
                  }`}
                >
                  <div className="font-medium text-sm text-ink truncate">{conv.title}</div>
                  <div className="text-xs text-ink-muted mt-0.5">
                    {conv.messageCount} messages · {conv.tokensUsed} tokens
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Chat Area */}
      <Card className="lg:col-span-3 flex flex-col overflow-hidden">
        {!selectedConversationId ? (
          <div className="flex-1 flex items-center justify-center text-ink-muted">
            <div className="text-center">
              <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Select or create a conversation</p>
              <p className="text-sm">Start chatting with your AI assistant</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-ink">{currentConversation?.title}</h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  {currentConversation?.messageCount} messages · {currentConversation?.tokensUsed} tokens
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm({ type: 'conversation', id: selectedConversationId })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'items-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-brand text-ink-inverse flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className="flex-1 max-w-[85%]">
                    {editingMessageId === msg.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          placeholder="Edit message..."
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleEditMessage}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingMessageId(null);
                              setEditingContent('');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm ${
                          msg.role === 'user'
                            ? 'bg-brand text-ink-inverse ml-auto whitespace-pre-wrap'
                            : 'bg-bg-muted border border-border text-ink'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <div className="flex items-start justify-between gap-2">
                            <span>{msg.content}</span>
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingMessageId(msg.id!);
                                  setEditingContent(msg.content);
                                }}
                                className="p-1 hover:bg-white/20 rounded"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm({ type: 'message', id: msg.id! })}
                                className="p-1 hover:bg-white/20 rounded"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="prose prose-sm max-w-none prose-headings:text-ink prose-p:text-ink prose-strong:text-ink prose-li:text-ink"
                            dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                          />
                        )}
                        {msg.edited && (
                          <div className="text-xs opacity-70 mt-1">(edited)</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={sendMessage.isPending}
                />
                <Button type="submit" loading={sendMessage.isPending} disabled={!message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </Card>

      {/* New Conversation Modal */}
      <Modal
        isOpen={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        title="New Conversation"
      >
        <div className="space-y-4">
          <Input
            value={newConversationTitle}
            onChange={(e) => setNewConversationTitle(e.target.value)}
            placeholder="Enter conversation title..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateConversation();
              }
            }}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowNewConversation(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateConversation} loading={createConversation.isPending}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title={`Delete ${showDeleteConfirm?.type === 'conversation' ? 'Conversation' : 'Message'}?`}
      >
        <div className="space-y-4">
          <p className="text-ink-muted">
            Are you sure you want to delete this {showDeleteConfirm?.type}? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (showDeleteConfirm?.type === 'conversation') {
                  handleDeleteConversation(showDeleteConfirm.id);
                } else {
                  handleDeleteMessage(showDeleteConfirm!.id);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
