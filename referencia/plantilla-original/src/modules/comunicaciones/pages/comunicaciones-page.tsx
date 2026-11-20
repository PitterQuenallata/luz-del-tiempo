import React, { useState } from 'react';
import {
  MessageSquare,
  Mail,
  Users,
} from 'lucide-react';
import { ComunicacionesChatTab } from '../components/comunicaciones-chat-tab';
import { ComunicacionesEmailTab } from '../components/comunicaciones-email-tab';
import { ComunicacionesContactosTab } from '../components/comunicaciones-contactos-tab';
import { CRMContact } from '../types/comunicaciones.types';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';

export type ComunicacionesSubTab = 'chat' | 'email' | 'contacts';

export const ComunicacionesPage: React.FC = () => {
  const { play } = useSound();
  const [activeTab, setActiveTab] = useState<ComunicacionesSubTab>('chat');

  const handleStartChatWithContact = (contact: CRMContact) => {
    setActiveTab('chat');
    play('pop');
    pillToast.info('Conversación Iniciada', `Canal de chat directo con ${contact.name}.`);
  };

  const handleSendEmailToContact = (contact: CRMContact) => {
    setActiveTab('email');
    play('pop');
    pillToast.info('Redacción de Correo', `Destinatario configurado: ${contact.email}.`);
  };

  const subTabs: {
    id: ComunicacionesSubTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    { id: 'chat', label: 'Chat en Tiempo Real', icon: MessageSquare, badge: 'Live' },
    { id: 'email', label: 'Correo Corporativo', icon: Mail, badge: '2' },
    { id: 'contacts', label: 'Directorio CRM', icon: Users, badge: '8' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-mono">
          <span>Colaboración en Vivo</span>
          <span>/</span>
          <span className="text-foreground">Comunicaciones & Mensajería</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Chat de Equipo, Webmail & CRM
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
              Estructura integral adaptada de la plantilla Modernize: mensajería directa con canales y respuestas simuladas, cliente de correo con bandejas organizadas y libreta de contactos comerciales.
            </p>
          </div>
        </div>
      </div>

      {/* Segmented Sub-Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/50 border border-border overflow-x-auto">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                play('tab');
                setActiveTab(tab.id as ComunicacionesSubTab);
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
                isActive
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-primary' : 'text-muted-foreground')} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={cn(
                    'font-mono text-[10px] px-1.5 py-0.2 rounded-full tabular-nums',
                    isActive
                      ? 'bg-primary text-white font-bold'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SUB-TAB CONTENTS */}
      {activeTab === 'chat' && <ComunicacionesChatTab />}
      {activeTab === 'email' && <ComunicacionesEmailTab />}
      {activeTab === 'contacts' && (
        <ComunicacionesContactosTab
          onStartChat={handleStartChatWithContact}
          onSendEmail={handleSendEmailToContact}
        />
      )}
    </div>
  );
};
