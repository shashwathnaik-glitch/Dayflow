'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <p className="text-muted-foreground text-sm">Redirecting to login...</p>
    </div>
  );
}
