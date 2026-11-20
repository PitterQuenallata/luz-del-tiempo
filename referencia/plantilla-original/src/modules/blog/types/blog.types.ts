export interface BlogComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  date: string;
  content: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'Design Systems' | 'Ingeniería Web' | 'Arquitectura Cloud' | 'Accesibilidad' | 'Fintech';
  coverImage: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  readingTime: string; // e.g. "4 min"
  publishedAt: string;
  viewsCount: number;
  likesCount: number;
  isLiked?: boolean;
  commentsCount: number;
  comments: BlogComment[];
  isFeatured?: boolean;
  status: 'published' | 'draft';
  tags: string[];
}
