'use client';
import { useState, useEffect } from 'react';
import { getCategories } from '@/app/actions';

export function useCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories().then(data => {
      setCategories(data);
      setLoading(false);
    });
  }, []);

  return { categories, loading };
}
