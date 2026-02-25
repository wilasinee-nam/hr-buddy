"use client";

import { Info } from "lucide-react";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TodayStatus } from "@/components/dashboard/TodayStatus";
import { MonthlyStats } from "@/components/dashboard/MonthlyStats";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
    const today = new Date();
    const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };
    const dateString = today.toLocaleDateString('th-TH', dateOptions);
    return (
        <div className="p-4 space-y-4">
            {/* Welcome Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-medium text-muted-foreground">วันนี้</h2>
                    <p className="text-lg font-bold text-foreground">{dateString}</p>
                </div>
                <div className="flex items-center gap-1 text-success bg-success/10 px-2 py-1 rounded-full border border-success/20">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-xs font-medium">กำลังทำงาน</span>
                </div>
            </div>

            {/* Quick Stats */}
            <TodayStatus status="checked_in" checkInTime="08:30" />

            {/* Main Menu Grid / Quick Actions */}
            <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3">เมนูลัด</h3>
                <QuickActions />
            </div>

            {/* Monthly Summary Card */}
            <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3">สรุปประจำเดือนกุมภาพันธ์</h3>
                <MonthlyStats workDays={20} leaveDays={1} lateDays={2} absentDays={0} />
            </div>

            {/* Info Card */}
            <Card className="bg-primary/5 border-primary/10 mt-6">
                <CardContent className="p-4 flex gap-3">
                    <div className="bg-primary/10 p-2 rounded-full h-fit">
                        <Info className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-primary">สิทธิ์การลาคงเหลือ</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">คุณมีสิทธิ์ลาพักร้อนคงเหลือ 5 วัน และลากิจ 3 วัน ในปีนี้</p>
                        <Button variant="link" size="sm" className="h-auto p-0 text-[10px] mt-1">
                            ดูรายละเอียด
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
