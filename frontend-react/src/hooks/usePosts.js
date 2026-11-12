import { useState, useEffect, useCallback } from 'react';
import { getPosts } from '../services/api';

export const usePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPosts();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.mensagem || 'Erro ao carregar posts. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, loading, error, refetch: fetchPosts };
};

