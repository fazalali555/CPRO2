import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useEmployeeContext } from '../../../contexts/EmployeeContext';
import { SanctionedPost } from '../types';
import { STORAGE_KEYS } from '../constants';

export function useSNEData() {
  const { employees } = useEmployeeContext();
  const [posts, setPosts] = useLocalStorage<SanctionedPost[]>(
    STORAGE_KEYS.SNE_POSTS,
    []
  );

  const computedPosts = useMemo(() => {
    return posts.map(post => {
      const filled = employees.filter(emp =>
        (emp.employees.designation || '').toLowerCase() === post.designation.toLowerCase() &&
        emp.employees.bps === post.bps
      ).length;
      const vacant = Math.max(post.sanctioned - filled, 0);
      return { ...post, filled, vacant };
    });
  }, [posts, employees]);

  const statistics = useMemo(() => ({
    totalSanctioned: computedPosts.reduce((sum, post) => sum + post.sanctioned, 0),
    totalFilled: computedPosts.reduce((sum, post) => sum + post.filled, 0),
    totalVacant: computedPosts.reduce((sum, post) => sum + post.vacant, 0),
  }), [computedPosts]);

  const addPost = useCallback((post: Omit<SanctionedPost, 'id' | 'filled' | 'vacant' | 'status'>) => {
    const newPost: SanctionedPost = {
      ...post,
      id: Date.now().toString(),
      filled: 0,
      vacant: 0,
      status: 'Active'
    };
    setPosts(prev => [newPost, ...prev]);
  }, [setPosts]);

  const removePost = useCallback((id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  }, [setPosts]);

  const updatePost = useCallback((id: string, updates: Partial<SanctionedPost>) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, [setPosts]);

  return {
    posts: computedPosts,
    statistics,
    addPost,
    removePost,
    updatePost,
  };
}
