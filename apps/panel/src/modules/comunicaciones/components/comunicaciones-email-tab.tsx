import React, { useState } from 'react';
import {
  Inbox,
  Send,
  Star,
  FileText,
  Trash2,
  Plus,
  Search,
  Paperclip,
  ArrowLeft,
  Download,
  X,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Input } from '../../../shared/components/ui/input';
import { EmailMessage, EmailFolder } from '../types/comunicaciones.types';
import { initialEmails } from '../data/comunicaciones-data';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';

export const ComunicacionesEmailTab: React.FC = () => {
  const { play } = useSound();
  const [emails, setEmails] = useState<EmailMessage[]>(initialEmails);
  const [currentFolder, setCurrentFolder] = useState<EmailFolder>('inbox');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');

  // Quick Reply State
  const [replyText, setReplyText] = useState('');

  // Filtered emails
  const filteredEmails = emails.filter((mail) => {
    const matchFolder =
      currentFolder === 'starred' ? mail.isStarred : mail.folder === currentFolder;
    const matchTag = !selectedTag || (mail.tags && mail.tags.includes(selectedTag));
    const matchSearch =
      mail.subject.toLowerCase().includes(search.toLowerCase()) ||
      mail.senderName.toLowerCase().includes(search.toLowerCase()) ||
      mail.snippet.toLowerCase().includes(search.toLowerCase());

    return matchFolder && matchTag && matchSearch;
  });

  const unreadInboxCount = emails.filter((m) => m.folder === 'inbox' && !m.isRead).length;

  const handleToggleStar = (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    play('pop');
    setEmails((prev) =>
      prev.map((m) => (m.id === emailId ? { ...m, isStarred: !m.isStarred } : m))
    );
  };

  const handleOpenEmail = (mail: EmailMessage) => {
    play('click');
    setSelectedEmail(mail);
    if (!mail.isRead) {
      setEmails((prev) =>
        prev.map((m) => (m.id === mail.id ? { ...m, isRead: true } : m))
      );
    }
  };

  const handleSendCompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim() || !subject.trim()) {
      play('alert');
      pillToast.error('Campos Requeridos', 'Por favor ingresa destinatario y asunto.');
      return;
    }

    const newMail: EmailMessage = {
      id: `mail-${Date.now()}`,
      senderName: 'Mathew Anderson',
      senderEmail: 'mathew.anderson@blakor.io',
      senderAvatar: '/images/profile/user-1.jpg',
      subject,
      snippet: bodyText.slice(0, 80) + '...',
      body: bodyText,
      date: 'Justo ahora',
      folder: 'sent',
      isRead: true,
      isStarred: false,
      tags: ['Enviado'],
    };

    setEmails([newMail, ...emails]);
    setIsComposeOpen(false);
    setToEmail('');
    setSubject('');
    setBodyText('');
    play('success');
    pillToast.success('Correo Enviado', `Mensaje despachado a ${toEmail}.`);
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedEmail) return;
    play('success');
    setReplyText('');
    pillToast.success('Respuesta Enviada', `Copia remitida a ${selectedEmail.senderEmail}.`);
  };

  return (
    <div className="space-y-6">
      <Card className="border-border overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
          {/* Left Column (3 cols): Folders & Compose */}
          <div className="lg:col-span-3 border-r border-border/60 p-4 space-y-6 bg-card/60">
            <Button
              variant="default"
              size="sm"
              soundType="pop"
              onClick={() => {
                play('pop');
                setIsComposeOpen(true);
              }}
              className="w-full text-xs h-10 gap-2 justify-center font-semibold"
            >
              <Plus className="h-4 w-4" />
              Redactar Correo
            </Button>

            {/* Folder Navigation */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block font-bold mb-1.5 px-3">
                Bandejas
              </span>
              {[
                { id: 'inbox', label: 'Bandeja de Entrada', icon: Inbox, count: unreadInboxCount },
                { id: 'sent', label: 'Enviados', icon: Send },
                { id: 'starred', label: 'Destacados', icon: Star },
                { id: 'drafts', label: 'Borradores', icon: FileText },
              ].map((f) => {
                const Icon = f.icon;
                const isSelected = currentFolder === f.id && !selectedTag;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      play('tab');
                      setCurrentFolder(f.id as EmailFolder);
                      setSelectedTag(null);
                      setSelectedEmail(null);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer',
                      isSelected
                        ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-3.5 w-3.5" />
                      <span>{f.label}</span>
                    </div>
                    {f.count && f.count > 0 ? (
                      <span
                        className={cn(
                          'font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums',
                          isSelected ? 'bg-primary-foreground text-primary' : 'bg-primary text-white'
                        )}
                      >
                        {f.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Labels Filter */}
            <div className="space-y-1 pt-3 border-t border-border/50">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block font-bold mb-1.5 px-3">
                Etiquetas
              </span>
              {['Finanzas', 'Ingeniería', 'Diseño', 'Comercial'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    play('click');
                    setSelectedTag(selectedTag === tag ? null : tag);
                    setSelectedEmail(null);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer',
                    selectedTag === tag
                      ? 'bg-secondary text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                  )}
                >
                  <span className="truncate">{tag}</span>
                  {selectedTag === tag && <Check className="h-3 w-3 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column (9 cols): Email List OR Reader */}
          <div className="lg:col-span-9 flex flex-col justify-between bg-card">
            {selectedEmail ? (
              /* Full Email Reader */
              <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      soundType="click"
                      onClick={() => setSelectedEmail(null)}
                      className="text-xs gap-1.5 -ml-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Volver a la Lista
                    </Button>

                    <div className="flex items-center gap-2">
                      {selectedEmail.tags?.map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px] font-mono">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Subject & Sender Meta */}
                  <div className="space-y-2">
                    <h3 className="font-heading text-base font-bold text-foreground">
                      {selectedEmail.subject}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={selectedEmail.senderAvatar || '/images/profile/user-2.jpg'}
                          alt={selectedEmail.senderName}
                          className="h-8 w-8 rounded-xl object-cover border border-border"
                        />
                        <div>
                          <span className="font-semibold text-foreground block">{selectedEmail.senderName}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">{selectedEmail.senderEmail}</span>
                        </div>
                      </div>
                      <span className="font-mono text-[11px]">{selectedEmail.date}</span>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="p-5 rounded-2xl bg-secondary/20 border border-border text-xs leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                    {selectedEmail.body}
                  </div>

                  {/* Attachments Strip */}
                  {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-semibold text-muted-foreground block font-mono">
                        Archivos Adjuntos ({selectedEmail.attachments.length}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmail.attachments.map((att, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              play('click');
                              pillToast.success('Archivo Descargado', `${att.name} guardado en descargas.`);
                            }}
                            className="flex items-center gap-2 p-2 px-3 rounded-xl border border-border bg-card hover:bg-secondary cursor-pointer transition-colors text-xs font-mono"
                          >
                            <Paperclip className="h-3.5 w-3.5 text-primary" />
                            <span className="text-foreground font-medium">{att.name}</span>
                            <span className="text-muted-foreground text-[10px]">({att.size})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Reply Box */}
                <div className="pt-4 border-t border-border/50 space-y-2.5">
                  <span className="text-xs font-semibold text-foreground block">Respuesta Rápida</span>
                  <div className="flex gap-2">
                    <Input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Escribe una respuesta a ${selectedEmail.senderName}...`}
                      className="text-xs h-9 bg-background"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                    />
                    <Button
                      variant="default"
                      size="sm"
                      soundType="pop"
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                      className="text-xs h-9 px-4 shrink-0"
                    >
                      Responder
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Email List Table */
              <div>
                {/* Search Bar */}
                <div className="p-4 border-b border-border/50">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar por asunto, remitente o extracto de texto..."
                      className="pl-9 text-xs h-9 bg-background"
                    />
                  </div>
                </div>

                <div className="divide-y divide-border/50 max-h-[550px] overflow-y-auto">
                  {filteredEmails.length === 0 ? (
                    <div className="p-12 text-center text-xs text-muted-foreground">
                      No hay correos en esta bandeja.
                    </div>
                  ) : (
                    filteredEmails.map((mail) => (
                      <div
                        key={mail.id}
                        onClick={() => handleOpenEmail(mail)}
                        className={cn(
                          'p-4 flex items-center justify-between gap-4 transition-colors cursor-pointer group',
                          !mail.isRead ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/30'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Star Toggle */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleStar(mail.id, e)}
                            className="text-muted-foreground hover:text-amber-500 cursor-pointer shrink-0"
                          >
                            <Star
                              className={cn(
                                'h-4 w-4',
                                mail.isStarred ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/60'
                              )}
                            />
                          </button>

                          {/* Sender Initials / Avatar */}
                          <div className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center font-mono text-[10px] font-bold text-foreground shrink-0 border border-border">
                            {mail.senderName
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>

                          {/* Subject & Snippet */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'text-xs truncate',
                                  !mail.isRead ? 'font-bold text-foreground' : 'font-medium text-foreground/80'
                                )}
                              >
                                {mail.senderName}
                              </span>
                              {!mail.isRead && (
                                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                            <p
                              className={cn(
                                'text-[11px] truncate',
                                !mail.isRead ? 'text-foreground font-semibold' : 'text-muted-foreground'
                              )}
                            >
                              {mail.subject}
                            </p>
                          </div>
                        </div>

                        {/* Date & Tags */}
                        <div className="flex items-center gap-3 shrink-0 text-right">
                          {mail.tags?.[0] && (
                            <Badge variant="outline" className="text-[9px] font-mono hidden sm:inline-flex">
                              {mail.tags[0]}
                            </Badge>
                          )}
                          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                            {mail.date}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Compose Email Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-xl border-border shadow-2xl">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Redactar Mensaje Corporativo</CardTitle>
                  <CardDescription className="text-xs">
                    Envío oficial desde mathew.anderson@blakor.io
                  </CardDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <form onSubmit={handleSendCompose}>
              <CardContent className="p-6 space-y-4 text-xs">
                <div>
                  <label className="font-medium text-foreground block mb-1.5">Destinatario (Para:)</label>
                  <Input
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="ej. cliente@empresa.com"
                    className="text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-medium text-foreground block mb-1.5">Asunto</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="ej. Actualización de Propuesta y Documentación Técnica"
                    className="text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-medium text-foreground block mb-1.5">Cuerpo del Mensaje</label>
                  <textarea
                    rows={8}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder="Escribe el contenido formal del mensaje..."
                    className="w-full p-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-hidden leading-relaxed resize-none"
                    required
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t border-border/50 flex items-center justify-between bg-secondary/20">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  soundType="click"
                  onClick={() => {
                    play('click');
                    pillToast.info('Adjuntar Archivo', 'Selecciona el documento PDF o imagen.');
                  }}
                  className="text-xs gap-1.5 text-muted-foreground"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Adjuntar
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    soundType="click"
                    onClick={() => setIsComposeOpen(false)}
                    className="text-xs"
                  >
                    Descartar
                  </Button>

                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    soundType="success"
                    className="text-xs gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Enviar Correo
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
