"use client";


import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface AttendanceRecord {
    date: string;
    dayName: string;
    checkIn: string | null;
    checkOut: string | null;
    status: "present" | "late" | "absent" | "leave";
    workHours: string;
}

const mockHistory: AttendanceRecord[] = [
    { date: "2025-02-07", dayName: "ศุกร์", checkIn: "08:45", checkOut: null, status: "present", workHours: "-" },
    { date: "2025-02-06", dayName: "พฤหัสบดี", checkIn: "08:30", checkOut: "17:30", status: "present", workHours: "9:00" },
    { date: "2025-02-05", dayName: "พุธ", checkIn: "09:15", checkOut: "18:00", status: "late", workHours: "8:45" },
    { date: "2025-02-04", dayName: "อังคาร", checkIn: "08:25", checkOut: "17:45", status: "present", workHours: "9:20" },
    { date: "2025-02-03", dayName: "จันทร์", checkIn: null, checkOut: null, status: "leave", workHours: "-" },
];

export default function HistoryPage() {
    const getStatusInfo = (status: AttendanceRecord["status"]) => {
        switch (status) {
            case "present":
                return { label: "มาทำงาน", color: "bg-success/10 text-success", icon: CheckCircle };
            case "late":
                return { label: "มาสาย", color: "bg-warning/10 text-warning", icon: AlertTriangle };
            case "absent":
                return { label: "ขาด", color: "bg-destructive/10 text-destructive", icon: XCircle };
            case "leave":
                return { label: "ลา", color: "bg-info/10 text-info", icon: Calendar };
            default:
                return { label: "-", color: "bg-muted text-muted-foreground", icon: Clock };
        }
    };

    return (

        <div className="p-4 space-y-4">
            {/* Month Summary */}
            <Card className="border-none shadow-sm bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                <CardContent className="p-4">
                    <p className="text-sm opacity-80 mb-1">เดือนกุมภาพันธ์ 2568</p>
                    <div className="grid grid-cols-4 gap-2 mt-3">
                        <div className="text-center">
                            <p className="text-2xl font-bold">18</p>
                            <p className="text-[10px] opacity-70">มาทำงาน</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">1</p>
                            <p className="text-[10px] opacity-70">ลา</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">2</p>
                            <p className="text-[10px] opacity-70">สาย</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">0</p>
                            <p className="text-[10px] opacity-70">ขาด</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* History Tabs */}
            <Tabs defaultValue="week" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="week">สัปดาห์นี้</TabsTrigger>
                    <TabsTrigger value="month">เดือนนี้</TabsTrigger>
                    <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
                </TabsList>

                <TabsContent value="week" className="mt-4 space-y-2">
                    {mockHistory.map((record) => {
                        const statusInfo = getStatusInfo(record.status);
                        const StatusIcon = statusInfo.icon;

                        return (
                            <Card key={record.date} className="border-none shadow-sm">
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 text-center">
                                                <p className="text-lg font-bold text-foreground">
                                                    {record.date.split("-")[2]}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">{record.dayName}</p>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-[10px] text-muted-foreground">เข้า</p>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {record.checkIn || "-"}
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] text-muted-foreground">ออก</p>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {record.checkOut || "-"}
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] text-muted-foreground">ชม.</p>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {record.workHours}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <Badge className={statusInfo.color}>
                                            <StatusIcon className="h-3 w-3 mr-1" />
                                            {statusInfo.label}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </TabsContent>

                <TabsContent value="month" className="mt-4">
                    <Card className="border-none shadow-sm">
                        <CardContent className="p-4 text-center text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">ข้อมูลเดือนนี้ทั้งหมด</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="all" className="mt-4">
                    <Card className="border-none shadow-sm">
                        <CardContent className="p-4 text-center text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">ประวัติการทำงานทั้งหมด</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>

    );
}
