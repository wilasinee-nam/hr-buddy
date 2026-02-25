'use client';

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OrganizationNotFound() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
            <div className="max-w-md w-full bg-card rounded-2xl shadow-lg border p-12 space-y-8">
                <div className="flex justify-center">
                    <div className="bg-orange-50 p-6 rounded-full dark:bg-orange-950/20">
                        <AlertCircle className="w-16 h-16 text-[#faad14]" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-2xl font-bold text-foreground">ไม่พบข้อมูลบริษัท</h1>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        ไม่พบรหัสบริษัทที่ระบุในระบบ <br />
                        กรุณาตรวจสอบลิงก์อีกครั้งหรือติดต่อผู้ดูแลระบบ
                    </p>
                </div>

                <div className="pt-4">
                    <Button
                        onClick={() => router.push('/introduction')}
                        variant="default"
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-12 text-lg font-medium transition-colors"
                        style={{ borderRadius: '8px' }}
                    >
                        ไปหน้าแนะนำระบบ
                    </Button>
                </div>
            </div>
        </div>
    );
}
