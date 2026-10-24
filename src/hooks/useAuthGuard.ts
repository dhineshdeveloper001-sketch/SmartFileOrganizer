'use client';

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';

export function useAuthGuard(requireAdmin: boolean = false) {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (requireAdmin && user.role !== 'ROLE_ADMIN') {
      router.replace('/');
    }
  }, [user, loading, requireAdmin, router]);

  return { user, loading, isAuthed: !!user, isAdmin: user?.role === 'ROLE_ADMIN' };
}
