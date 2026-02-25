
"use client";

import { ReactNode } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useStore } from "@/store/useStore";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function MainLayout({ children }: { children: ReactNode }) {
    const { user, organization } = useStore();

    // Since we are in a protected route (conceptually), we might want to wait for hydration
    // However, the root layout handles the initial redirect if keys are missing from cookies.
    // The StoreInitializer hydrates the store. 
    // If user is null but we are here, it might be loading or truly null.
    // For now, let's render. MobileLayout handles optional user/org gracefully (shows defaults or nothing).
    // Or closer to Home page logic:
    if (!user || !organization) {
        return <LoadingScreen />
    }

    return (
        <MobileLayout user={user} organization={organization}>
            {children}
        </MobileLayout>
    );
}
