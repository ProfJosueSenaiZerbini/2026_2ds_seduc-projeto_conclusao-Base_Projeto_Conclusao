import { useState, useEffect, useCallback } from 'react';
import { getPost } from '../services/api';

export const usePost = (id) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPost = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getPost(id);
      if (data) {
        setPost(data);
      } else {
        setError('Publicação não encontrada.');
      }
    } catch (err) {
      setError(err.response?.data?.mensagem || 'Erro ao carregar a publicação. Pode ter sido removida ou não existe.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return { post, loading, error, refetch: fetchPost };
};
