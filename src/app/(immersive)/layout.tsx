
"use client";

import { ReactNode } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useStore } from "@/store/useStore";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function ImmersiveLayout({ children }: { children: ReactNode }) {
    const { user, organization } = useStore();

    if (!user || !organization) {
        return <LoadingScreen />
    }

    return (
        <MobileLayout user={user} organization={organization} showHeader={false}>
            {children}
        </MobileLayout>
    );
}
