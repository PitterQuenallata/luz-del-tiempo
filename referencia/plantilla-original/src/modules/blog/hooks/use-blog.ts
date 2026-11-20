import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { initialBlogPosts } from '../data/blog-data';
import { BlogPost } from '../types/blog.types';

const BLOG_QUERY_KEY = ['blog-posts'] as const;

let inMemoryPosts = [...initialBlogPosts];

export const useBlogPosts = () => {
  return useQuery({
    queryKey: BLOG_QUERY_KEY,
    queryFn: async (): Promise<BlogPost[]> => inMemoryPosts,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPost: BlogPost) => {
      inMemoryPosts = [newPost, ...inMemoryPosts];
      return newPost;
    },
    onSuccess: (newPost) => {
      queryClient.setQueryData<BlogPost[]>(BLOG_QUERY_KEY, (prev) => [newPost, ...(prev || [])]);
    },
  });
};
