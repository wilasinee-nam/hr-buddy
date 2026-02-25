
import React from 'react';

export function LoadingScreen() {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground text-sm animate-pulse">กำลังโหลดข้อมูล...</p>
            </div>
        </div>
    );
}
