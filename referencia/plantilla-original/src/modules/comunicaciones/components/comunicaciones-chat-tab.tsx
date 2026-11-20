import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Send,
  Paperclip,
  Phone,
  Video,
  Info,
  Hash,
  Check,
  CheckCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Input } from '../../../shared/components/ui/input';
import { ChatConversation, ChatMessage } from '../types/comunicaciones.types';
import { initialConversations } from '../data/comunicaciones-data';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';

export const ComunicacionesChatTab: React.FC = () => {
  const { play } = useSound();
  const [conversations, setConversations] = useState<ChatConversation[]>(initialConversations);
  const [activeConvId, setActiveConvId] = useState<string>(initialConversations[0].id);
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConvId, activeConv?.messages.length]);

  // Filter conversations
  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.role && c.role.toLowerCase().includes(search.toLowerCase())) ||
    (c.channelTopic && c.channelTopic.toLowerCase().includes(search.toLowerCase()))
  );

  const channels = filteredConversations.filter((c) => c.isChannel);
  const directChats = filteredConversations.filter((c) => !c.isChannel);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const myMessage: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: 'usr-me',
      senderName: 'Mathew Anderson',
      senderAvatar: '/images/profile/user-1.jpg',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    const updatedConversations = conversations.map((c) => {
      if (c.id === activeConvId) {
        return {
          ...c,
          lastMessage: `Mathew: ${inputText.trim()}`,
          lastMessageTime: myMessage.timestamp,
          messages: [...c.messages, myMessage],
        };
      }
      return c;
    });

    setConversations(updatedConversations);
    setInputText('');
    play('pop');

    // Simulated response from colleague if direct chat
    if (!activeConv.isChannel) {
      setTimeout(() => {
        const replyText = `Entendido Mathew, ya estoy revisando el cambio en el clúster.`;
        const replyMessage: ChatMessage = {
          id: `m-reply-${Date.now()}`,
          senderId: activeConv.id,
          senderName: activeConv.name,
          senderAvatar: activeConv.avatar || '/images/profile/user-2.jpg',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          isMe: false,
        };

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeConvId) {
              return {
                ...c,
                lastMessage: `${c.name.split(' ')[0]}: ${replyText}`,
                lastMessageTime: replyMessage.timestamp,
                messages: [...c.messages, replyMessage],
              };
            }
            return c;
          })
        );
        play('success');
        pillToast.info(`Nuevo mensaje de ${activeConv.name}`, replyText);
      }, 1400);
    }
  };

  return (
    <Card className="border-border overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Left Column (4 cols): Conversations List */}
        <div className="lg:col-span-4 border-r border-border/60 flex flex-col justify-between bg-card/60">
          <div>
            {/* User status card strip */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src="/images/profile/user-1.jpg"
                    alt="Mathew Anderson"
                    className="h-10 w-10 rounded-2xl object-cover border border-border"
                  />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Mathew Anderson</h4>
                  <span className="text-[10px] text-muted-foreground font-mono">Lead Designer • En Línea</span>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-border/40">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar canal o compañero..."
                  className="pl-8 text-xs h-8 bg-background"
                />
              </div>
            </div>

            {/* Channels & Direct Chats Scrollable List */}
            <div className="divide-y divide-border/30 max-h-[500px] overflow-y-auto">
              {/* Channels Section */}
              {channels.length > 0 && (
                <div className="py-2">
                  <span className="px-4 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground block font-bold">
                    Canales de Equipo
                  </span>
                  {channels.map((ch) => {
                    const isSelected = ch.id === activeConvId;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          play('click');
                          setActiveConvId(ch.id);
                        }}
                        className={cn(
                          'w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors cursor-pointer',
                          isSelected ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/30 text-foreground'
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs truncate">{ch.name}</span>
                        </div>
                        {ch.unreadCount && ch.unreadCount > 0 ? (
                          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded-full bg-primary text-white font-bold">
                            {ch.unreadCount}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Direct Chats Section */}
              <div className="py-2">
                <span className="px-4 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground block font-bold">
                  Mensajes Directos
                </span>
                {directChats.map((c) => {
                  const isSelected = c.id === activeConvId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        play('click');
                        setActiveConvId(c.id);
                      }}
                      className={cn(
                        'w-full text-left p-3 px-4 flex items-center justify-between gap-3 transition-colors cursor-pointer',
                        isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/30'
                      )}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="relative shrink-0">
                          <img
                            src={c.avatar}
                            alt={c.name}
                            className="h-9 w-9 rounded-xl object-cover border border-border"
                          />
                          {c.isOnline && (
                            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border border-card" />
                          )}
                        </div>
                        <div className="truncate">
                          <h5 className="text-xs font-semibold text-foreground truncate">{c.name}</h5>
                          <p className="text-[11px] text-muted-foreground truncate">{c.lastMessage}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono text-muted-foreground block">
                          {c.lastMessageTime}
                        </span>
                        {c.unreadCount && c.unreadCount > 0 ? (
                          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded-full bg-primary text-white font-bold inline-block mt-0.5">
                            {c.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (8 cols): Active Chat Conversation Stream */}
        <div className="lg:col-span-8 flex flex-col justify-between h-full bg-card">
          {/* Active Chat Header */}
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeConv.isChannel ? (
                <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
                  <Hash className="h-5 w-5" />
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={activeConv.avatar}
                    alt={activeConv.name}
                    className="h-10 w-10 rounded-2xl object-cover border border-border"
                  />
                  {activeConv.isOnline && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                  )}
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-foreground leading-tight">{activeConv.name}</h3>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {activeConv.isChannel
                    ? activeConv.channelTopic
                    : `${activeConv.role} • ${activeConv.isOnline ? 'En línea' : 'Desconectado'}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="iconSm"
                soundType="click"
                onClick={() => {
                  play('click');
                  pillToast.info('Llamada de Voz', `Conectando con ${activeConv.name}...`);
                }}
                title="Llamada de voz"
              >
                <Phone className="h-4 w-4 text-muted-foreground" />
              </Button>

              <Button
                variant="ghost"
                size="iconSm"
                soundType="click"
                onClick={() => {
                  play('click');
                  pillToast.info('Videollamada HD', `Iniciando sesión de video con ${activeConv.name}...`);
                }}
                title="Videollamada"
              >
                <Video className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[460px]">
            {activeConv.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex items-end gap-2.5',
                  msg.isMe ? 'justify-end' : 'justify-start'
                )}
              >
                {!msg.isMe && (
                  <img
                    src={msg.senderAvatar}
                    alt={msg.senderName}
                    className="h-7 w-7 rounded-xl object-cover border border-border shrink-0 mb-0.5"
                  />
                )}

                <div
                  className={cn(
                    'max-w-md p-3.5 rounded-2xl text-xs space-y-1',
                    msg.isMe
                      ? 'bg-primary text-primary-foreground rounded-br-2xs shadow-xs'
                      : 'bg-secondary/60 text-foreground border border-border/70 rounded-bl-2xs'
                  )}
                >
                  {!msg.isMe && (
                    <span className="text-[10px] font-semibold opacity-70 block font-mono">
                      {msg.senderName}
                    </span>
                  )}

                  <p className="leading-relaxed">{msg.text}</p>

                  <div
                    className={cn(
                      'text-[9px] font-mono text-right flex items-center justify-end gap-1 pt-0.5 opacity-70',
                      msg.isMe ? 'text-primary-foreground' : 'text-muted-foreground'
                    )}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.isMe && <CheckCheck className="h-3 w-3" />}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-border/50 flex items-center gap-2 bg-secondary/15">
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              soundType="click"
              onClick={() => {
                play('click');
                pillToast.info('Adjuntar Archivo', 'Selecciona un archivo o captura de pantalla.');
              }}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Enviar mensaje a ${activeConv.name}...`}
              className="text-xs h-9 bg-background flex-1"
            />

            <Button
              type="submit"
              variant="default"
              size="sm"
              soundType="pop"
              disabled={!inputText.trim()}
              className="text-xs h-9 px-3.5 gap-1.5 shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              Enviar
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
};
