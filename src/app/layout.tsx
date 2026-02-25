import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProviderWrapper } from "@/components/layout/QueryClientProviderWrapper";
import { PermissionProvider } from "@/contexts/PermissionContext";

import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import StoreInitializer from '@/components/StoreInitializer'
import { redirect } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HR Buddy",
  description: "HR Management System for LINE",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies()
  const appUserId = cookieStore.get('app_user_id')?.value
  const orgChannelId = cookieStore.get('org_channel_id')?.value
  const organizationId = cookieStore.get('organization_id')?.value

  let user = null
  let organization = null

  if (appUserId) {
    user = await prisma.user.findFirst({
      where: { id: parseInt(appUserId), organizationId: parseInt(organizationId) }
    })
    if (!user) {
      // User not found despite having ID cookie - session invalid
      // Redirect to logout handler to clear cookies properly
      return redirect('/api/auth/logout?redirect_to=/organization-not-found')
    }
  }

  if (orgChannelId) {
    organization = await prisma.organization.findFirst({
      where: { oaChannelId: orgChannelId, status: 'active' }
    })
  }

  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <StoreInitializer user={user} organization={organization} />
        <QueryClientProviderWrapper>
          <TooltipProvider>
            <PermissionProvider>
              {children}
              <Toaster />
              <Sonner />
            </PermissionProvider>
          </TooltipProvider>
        </QueryClientProviderWrapper>
      </body>
    </html>
  );
}
