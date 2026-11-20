export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  attachment?: string;
}

export interface ChatConversation {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  isChannel?: boolean;
  channelTopic?: string;
  isOnline?: boolean;
  unreadCount?: number;
  lastMessage: string;
  lastMessageTime: string;
  messages: ChatMessage[];
}

export type EmailFolder = 'inbox' | 'sent' | 'starred' | 'drafts' | 'trash';

export interface EmailMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  senderAvatar?: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  folder: EmailFolder;
  isRead: boolean;
  isStarred: boolean;
  tags?: string[];
  attachments?: { name: string; size: string }[];
}

export interface CRMContact {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  avatar: string;
  department: string;
  location: string;
}
