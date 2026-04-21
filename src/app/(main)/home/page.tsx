"use client";

import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TodayStatus } from "@/components/dashboard/TodayStatus";
import { MonthlyStats } from "@/components/dashboard/MonthlyStats";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
    const [status, setStatus] = useState<"not_checked" | "checked_in" | "checked_out">("not_checked");
    const [checkInTime, setCheckInTime] = useState<string | undefined>(undefined);
    const [checkOutTime, setCheckOutTime] = useState<string | undefined>(undefined);
    const [stats, setStats] = useState({ workDays: 0, leaveDays: 0, lateDays: 0, absentDays: 0 });

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const res = await fetch('/api/attendance');
                if (res.ok) {
                    const data = await res.json();
                    if (data.checkInTime) {
                        setCheckInTime(new Date(data.checkInTime).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }));
                        setStatus("checked_in");
                    }
                    
                    let isTimeToCheckOut = true;
                    if (data.expectedEndTime) {
                        const timeParts = data.expectedEndTime.split(':');
                        if (timeParts.length >= 2) {
                            const expectedHour = parseInt(timeParts[0], 10);
                            const expectedMinute = parseInt(timeParts[1], 10);
                            const expectedDate = new Date();
                            expectedDate.setHours(expectedHour, expectedMinute, 0, 0);
                            
                            if (new Date() < expectedDate) {
                                isTimeToCheckOut = false;
                            }
                        }
                    }

                    if (data.checkOutTime) {
                        if (data.isEarly) {
                            setCheckOutTime(undefined);
                        } else {
                            setCheckOutTime(new Date(data.checkOutTime).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }));
                        }
                        
                        if (isTimeToCheckOut) {
                            setStatus("checked_out");
                        } else {
                            // Checked out early, but it is currently not time to leave yet!
                            setStatus("checked_in");
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch attendance:", error);
            }
        };

        const fetchStats = async () => {
            try {
                const res = await fetch('/api/attendance/summary');
                if (res.ok) {
                    const data = await res.json();
                    setStats({
                        workDays: data.workDays || 0,
                        leaveDays: data.leaveDays || 0,
                        lateDays: data.lateDays || 0,
                        absentDays: data.absentDays || 0
                    });
                }
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            }
        };

        fetchAttendance();
        fetchStats();
    }, []);

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
                {/* <div>
                    <h2 className="text-sm font-medium text-muted-foreground">วันนี้</h2>
                    <p className="text-lg font-bold text-foreground">{dateString}</p>
                </div> */}
                {status === "checked_in" && (
                    <div className="flex items-center gap-1 text-success bg-success/10 px-2 py-1 rounded-full border border-success/20">
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <span className="text-xs font-medium">กำลังทำงาน</span>
                    </div>
                )}
                {status === "checked_out" && (
                    <div className="flex items-center gap-1 text-muted-foreground bg-muted px-2 py-1 rounded-full border border-border">
                        <span className="text-xs font-medium">เลิกงานแล้ว</span>
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            <TodayStatus 
                status={status} 
                checkInTime={checkInTime} 
                checkOutTime={checkOutTime} 
            />

            {/* Main Menu Grid / Quick Actions */}
            <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3">เมนูลัด</h3>
                <QuickActions />
            </div>

            {/* Monthly Summary Card */}
            <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3">สรุปประจำเดือน{today.toLocaleDateString('th-TH', { month: 'long' })}</h3>
                <MonthlyStats 
                    workDays={stats.workDays} 
                    leaveDays={stats.leaveDays} 
                    lateDays={stats.lateDays} 
                    absentDays={stats.absentDays} 
                />
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
