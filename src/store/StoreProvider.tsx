'use client';

import { useEffect, useMemo } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from '@/store';
import { fetchCurrentUser } from '@/store/authSlice';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => makeStore(), []);

  useEffect(() => {
    store.dispatch(fetchCurrentUser());
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
