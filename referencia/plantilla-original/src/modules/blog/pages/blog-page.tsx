import React, { useState } from 'react';
import { initialBlogPosts } from '../data/blog-data';
import { BlogPost } from '../types/blog.types';
import { useBlogPosts, useCreateBlogPost } from '../hooks/use-blog';
import { BlogListTab } from '../components/blog-list-tab';
import { BlogDetailTab } from '../components/blog-detail-tab';
import { BlogEditorTab } from '../components/blog-editor-tab';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';

type BlogTab = 'list' | 'detail' | 'editor';

export const BlogPage: React.FC = () => {
  const { play } = useSound();
  const { data: initialLoadedPosts = initialBlogPosts } = useBlogPosts();
  const createPostMutation = useCreateBlogPost();
  const [activeTab, setActiveTab] = useState<BlogTab>('list');
  const [posts, setPosts] = useState<BlogPost[]>(initialLoadedPosts);
  const [selectedPostId, setSelectedPostId] = useState<string>(initialBlogPosts[0].id);

  const selectedPost = posts.find((p) => p.id === selectedPostId) || posts[0];

  const handleSelectPost = (post: BlogPost) => {
    setSelectedPostId(post.id);
    setActiveTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isLiked = !post.isLiked;
          return {
            ...post,
            isLiked,
            likesCount: isLiked ? post.likesCount + 1 : post.likesCount - 1,
          };
        }
        return post;
      })
    );
  };

  const handleAddComment = (
    postId: string,
    commentData: { authorName: string; content: string }
  ) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const newComment = {
            id: `comm-${Date.now()}`,
            authorName: commentData.authorName,
            authorAvatar: '/images/profile/user-1.jpg',
            authorRole: 'Product Contributor',
            date: 'Hace un momento',
            content: commentData.content,
          };
          return {
            ...post,
            commentsCount: post.commentsCount + 1,
            comments: [newComment, ...post.comments],
          };
        }
        return post;
      })
    );
  };

  const handlePublishPost = (
    newPostData: Omit<BlogPost, 'id' | 'viewsCount' | 'likesCount' | 'commentsCount' | 'comments'>
  ) => {
    const newPost: BlogPost = {
      ...newPostData,
      id: `post-${Date.now()}`,
      viewsCount: 1,
      likesCount: 0,
      commentsCount: 0,
      comments: [],
    };
    setPosts([newPost, ...posts]);
    setSelectedPostId(newPost.id);
    setActiveTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Editorial Header & Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Blog & Publicaciones CMS
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Gestión editorial, divulgación técnica y moderación de artículos con directivas de alta precisión
          </p>
        </div>

        {/* Apple Segmented Bar */}
        <div className="inline-flex p-1 rounded-2xl bg-muted/60 border border-border/50 backdrop-blur-md self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              play('click');
              setActiveTab('list');
            }}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200',
              activeTab === 'list'
                ? 'bg-background text-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Catálogo Editorial
          </button>

          <button
            type="button"
            onClick={() => {
              play('click');
              setActiveTab('detail');
            }}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200',
              activeTab === 'detail'
                ? 'bg-background text-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Lectura de Artículo
          </button>

          <button
            type="button"
            onClick={() => {
              play('click');
              setActiveTab('editor');
            }}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200',
              activeTab === 'editor'
                ? 'bg-background text-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Redactor CMS
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'list' && (
        <BlogListTab
          posts={posts}
          onSelectPost={handleSelectPost}
          onNavigateToEditor={() => {
            setActiveTab('editor');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {activeTab === 'detail' && selectedPost && (
        <BlogDetailTab
          post={selectedPost}
          onBack={() => setActiveTab('list')}
          onToggleLike={handleToggleLike}
          onAddComment={handleAddComment}
        />
      )}

      {activeTab === 'editor' && (
        <BlogEditorTab
          onPublishPost={handlePublishPost}
          onCancel={() => setActiveTab('list')}
        />
      )}
    </div>
  );
};
export default BlogPage;
