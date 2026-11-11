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
      let backendPosts = [];
      try {
        const data = await getPosts();
        if (Array.isArray(data)) {
          backendPosts = data;
        }
      } catch (errApi) {
        console.warn('API getPosts com erro, utilizando cache local:', errApi);
      }

      // Recupera publicações criadas pela usuária salvas localmente
      const localPostsRaw = localStorage.getItem('plural_user_posts');
      const localPosts = localPostsRaw ? JSON.parse(localPostsRaw) : [];

      // Evita duplicidade por ID
      const idsExistentes = new Set(backendPosts.map((p) => String(p.id)));
      const extras = localPosts.filter((p) => !idsExistentes.has(String(p.id)));

      setPosts([...extras, ...backendPosts]);
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

