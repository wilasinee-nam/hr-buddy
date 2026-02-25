"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BarChart3,
    Users,
    Calendar,
    Clock,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    XCircle
} from "lucide-react";

// Mock data
const attendanceSummary = {
    totalEmployees: 25,
    presentToday: 22,
    onLeave: 2,
    absent: 1,
    lateToday: 3,
};

const monthlyData = [
    { name: "สมชาย ใจดี", department: "ฝ่ายขาย", workDays: 20, leaveDays: 1, lateDays: 0, absentDays: 0 },
    { name: "สมหญิง รักงาน", department: "คลังสินค้า", workDays: 19, leaveDays: 2, lateDays: 1, absentDays: 0 },
    { name: "วิชัย มั่นคง", department: "ฝ่ายขาย", workDays: 18, leaveDays: 1, lateDays: 3, absentDays: 0 },
    { name: "นภา สดใส", department: "ฝ่ายบุคคล", workDays: 21, leaveDays: 0, lateDays: 0, absentDays: 0 },
    { name: "มานี รักดี", department: "ฝ่ายบุคคล", workDays: 17, leaveDays: 3, lateDays: 2, absentDays: 1 },
];

const departments = ["ทั้งหมด", "ฝ่ายขาย", "คลังสินค้า", "ฝ่ายบุคคล", "ฝ่ายบัญชี"];

const years = ["2025", "2024", "2023"];
const months = [
    { value: "all", label: "ทั้งปี" },
    { value: "1", label: "มกราคม" },
    { value: "2", label: "กุมภาพันธ์" },
    { value: "3", label: "มีนาคม" },
    { value: "4", label: "เมษายน" },
    { value: "5", label: "พฤษภาคม" },
    { value: "6", label: "มิถุนายน" },
    { value: "7", label: "กรกฎาคม" },
    { value: "8", label: "สิงหาคม" },
    { value: "9", label: "กันยายน" },
    { value: "10", label: "ตุลาคม" },
    { value: "11", label: "พฤศจิกายน" },
    { value: "12", label: "ธันวาคม" },
];

export default function ReportsPage() {
    const [selectedYear, setSelectedYear] = useState("2025");
    const [selectedMonth, setSelectedMonth] = useState("all");
    const [selectedDepartment, setSelectedDepartment] = useState("ทั้งหมด");
    const [activeTab, setActiveTab] = useState("overview");

    const filteredData = monthlyData.filter(emp =>
        selectedDepartment === "ทั้งหมด" || emp.department === selectedDepartment
    );

    const totalStats = filteredData.reduce((acc, emp) => ({
        workDays: acc.workDays + emp.workDays,
        leaveDays: acc.leaveDays + emp.leaveDays,
        lateDays: acc.lateDays + emp.lateDays,
        absentDays: acc.absentDays + emp.absentDays,
    }), { workDays: 0, leaveDays: 0, lateDays: 0, absentDays: 0 });

    return (

        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-bold text-foreground">รายงานภาพรวม</h1>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-3 gap-2">
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(year => (
                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map(month => (
                                    <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map(dept => (
                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview" className="text-xs">ภาพรวมวันนี้</TabsTrigger>
                    <TabsTrigger value="monthly" className="text-xs">สรุปรายเดือน</TabsTrigger>
                </TabsList>

                {/* Today Overview Tab */}
                <TabsContent value="overview" className="space-y-3 mt-3">
                    {/* Today Stats Cards */}
                    <div className="grid grid-cols-2 gap-2">
                        <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="p-3 text-center">
                                <Users className="h-6 w-6 text-primary mx-auto mb-1" />
                                <p className="text-2xl font-bold text-primary">{attendanceSummary.totalEmployees}</p>
                                <p className="text-[10px] text-muted-foreground">พนักงานทั้งหมด</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-success/5 border-success/20">
                            <CardContent className="p-3 text-center">
                                <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-1" />
                                <p className="text-2xl font-bold text-success">{attendanceSummary.presentToday}</p>
                                <p className="text-[10px] text-muted-foreground">มาทำงานวันนี้</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-warning/5 border-warning/20">
                            <CardContent className="p-3 text-center">
                                <Calendar className="h-6 w-6 text-warning mx-auto mb-1" />
                                <p className="text-2xl font-bold text-warning">{attendanceSummary.onLeave}</p>
                                <p className="text-[10px] text-muted-foreground">ลางาน</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-destructive/5 border-destructive/20">
                            <CardContent className="p-3 text-center">
                                <XCircle className="h-6 w-6 text-destructive mx-auto mb-1" />
                                <p className="text-2xl font-bold text-destructive">{attendanceSummary.absent}</p>
                                <p className="text-[10px] text-muted-foreground">ขาดงาน</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Late Today */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-warning" />
                                มาสายวันนี้
                                <Badge variant="secondary" className="ml-auto text-xs">
                                    {attendanceSummary.lateToday} คน
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {["วิชัย มั่นคง - 09:15", "มานี รักดี - 09:05", "สมหญิง รักงาน - 08:45"].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-warning/5 rounded-md text-sm">
                                    <span>{item.split(" - ")[0]}</span>
                                    <Badge variant="outline" className="text-warning text-xs">
                                        {item.split(" - ")[1]}
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* On Leave Today */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                ลางานวันนี้
                                <Badge variant="secondary" className="ml-auto text-xs">
                                    {attendanceSummary.onLeave} คน
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {["นภา สดใส - ลาพักร้อน", "กิตติ ประธาน - ลากิจ"].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-primary/5 rounded-md text-sm">
                                    <span>{item.split(" - ")[0]}</span>
                                    <Badge variant="outline" className="text-xs">
                                        {item.split(" - ")[1]}
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Monthly Summary Tab */}
                <TabsContent value="monthly" className="space-y-3 mt-3">
                    {/* Monthly Stats Summary */}
                    <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold">สรุปประจำเดือน</p>
                                <Badge variant="outline" className="text-xs">
                                    {filteredData.length} คน
                                </Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div>
                                    <p className="text-lg font-bold text-success">{totalStats.workDays}</p>
                                    <p className="text-[10px] text-muted-foreground">วันทำงาน</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-primary">{totalStats.leaveDays}</p>
                                    <p className="text-[10px] text-muted-foreground">วันลา</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-warning">{totalStats.lateDays}</p>
                                    <p className="text-[10px] text-muted-foreground">มาสาย</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-destructive">{totalStats.absentDays}</p>
                                    <p className="text-[10px] text-muted-foreground">ขาดงาน</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employee List */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                รายละเอียดพนักงาน
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {filteredData.map((emp, index) => (
                                <div key={index} className="p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className="text-sm font-medium">{emp.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{emp.department}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                        <div className="p-1.5 bg-success/10 rounded">
                                            <p className="font-semibold text-success">{emp.workDays}</p>
                                            <p className="text-[9px] text-muted-foreground">ทำงาน</p>
                                        </div>
                                        <div className="p-1.5 bg-primary/10 rounded">
                                            <p className="font-semibold text-primary">{emp.leaveDays}</p>
                                            <p className="text-[9px] text-muted-foreground">ลา</p>
                                        </div>
                                        <div className="p-1.5 bg-warning/10 rounded">
                                            <p className="font-semibold text-warning">{emp.lateDays}</p>
                                            <p className="text-[9px] text-muted-foreground">สาย</p>
                                        </div>
                                        <div className="p-1.5 bg-destructive/10 rounded">
                                            <p className="font-semibold text-destructive">{emp.absentDays}</p>
                                            <p className="text-[9px] text-muted-foreground">ขาด</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>

    );
}
