"use client";

import { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { User, Organization } from "@prisma/client";

interface MobileLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  title?: string;
  user?: User;
  organization?: Organization;
}

export function MobileLayout({ children, showHeader = true, title, user, organization }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {showHeader && <Header title={title} userName={user?.name} img={user?.pictureUrl} />}
      <main className="flex-1 pb-20 overflow-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
