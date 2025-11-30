"use client";

import dynamic from 'next/dynamic';

const MainLayout = dynamic(() => import('@/components/MainLayout'), { 
  ssr: false,
  loading: () => <div className="h-screen w-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-500">Loading Editor...</div>
});

export default function Home() {
  return (
    <MainLayout />
  );
}
