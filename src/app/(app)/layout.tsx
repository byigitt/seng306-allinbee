import React from 'react';
import BottomNavigation from '@/app/_components/common/bottom-navigation'; // Placeholder for BottomNav
import PageHeader from '@/app/_components/common/page-header'; // Placeholder for PageHeader

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader title="AllInBee" />
      <main className="flex-grow bg-muted/40 p-4 md:p-6">
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
} 