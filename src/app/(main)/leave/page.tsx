"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Calendar, Clock, CheckCircle, XCircle, Hourglass, Info } from "lucide-react";
import Link from "next/link";
import { getRemainingDays } from "@/types/leave";
import { getLeaveTypes } from "@/actions/leave-types";
import { getEntitlements, getLeaveRequests } from "@/actions/leave-requests";
import { LeaveType, LeaveEntitlement, LeaveRequest } from "@prisma/client";
import { useStore } from "@/store/useStore";

type LeaveRequestWithRelations = LeaveRequest & { leaveType: LeaveType };
type LeaveEntitlementWithRelations = LeaveEntitlement & { leaveType: LeaveType };

export default function LeavePage() {
    const user = useStore((state) => state.user);
    const organization = useStore((state) => state.organization);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [entitlements, setEntitlements] = useState<LeaveEntitlementWithRelations[]>([]);
    const [requests, setRequests] = useState<LeaveRequestWithRelations[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (organization?.id && user?.id) {
                const currentYear = new Date().getFullYear();
                const [types, userEntitlements, userRequests] = await Promise.all([
                    getLeaveTypes(organization.id),
                    getEntitlements(user.id, currentYear),
                    getLeaveRequests(user.id, currentYear)
                ]);
                setLeaveTypes(types.filter(t => t.isActive));
                setEntitlements(userEntitlements);
                setRequests(userRequests as LeaveRequestWithRelations[]);
            }
        };
        fetchData();

    }, [organization?.id, user?.id]);

    const getEntitlement = (typeId: number) => {
        return entitlements.find((e) => e.leaveTypeId === typeId);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return (
                    <Badge className="bg-success/10 text-success hover:bg-success/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        อนุมัติ
                    </Badge>
                );
            case "rejected":
                return (
                    <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">
                        <XCircle className="h-3 w-3 mr-1" />
                        ไม่อนุมัติ
                    </Badge>
                );
            case "cancelled":
                return (
                    <Badge variant="outline" className="text-muted-foreground">
                        <XCircle className="h-3 w-3 mr-1" />
                        ยกเลิก
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-warning/10 text-warning hover:bg-warning/20">
                        <Hourglass className="h-3 w-3 mr-1" />
                        รอพิจารณา
                    </Badge>
                );
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("th-TH", {
            year: '2-digit', month: 'short', day: 'numeric'
        });
    };

    const renderLeaveCard = (request: LeaveRequestWithRelations) => (
        <Card key={request.id} className="border-none shadow-sm">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${request.leaveType?.color || 'bg-gray-400'}`} />
                        <div>
                            <p className="text-sm font-semibold text-foreground">{request.leaveType?.name}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                    {formatDate(request.startDate)}
                                    {request.startDate !== request.endDate && ` - ${formatDate(request.endDate)}`}
                                </span>
                            </div>
                        </div>
                    </div>
                    {getStatusBadge(request.status)}
                </div>
                {request.reason && <p className="text-xs text-muted-foreground">{request.reason}</p>}
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{request.totalDays} วัน</span>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="p-4 space-y-4">
            {/* Leave Balance - Updated with real entitlements */}
            <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">สิทธิ์การลาคงเหลือ</CardTitle>
                        <Link href="/leave/settings">
                            <Button variant="ghost" size="sm" className="text-xs">
                                <Info className="h-3 w-3 mr-1" />
                                ดูทั้งหมด
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {leaveTypes.slice(0, 4).map((type) => {
                        const entitlement = getEntitlement(type.id);

                        // If no entitlement and no default days (unlimited), show unlimited logic or 0
                        // For now, if no entitlement, skip or show basics
                        if (!entitlement && type.defaultDays === null) {
                            return (
                                <div key={type.id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${type.color || 'bg-gray-400'}`} />
                                            <span className="text-sm text-foreground">{type.name}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">ไม่จำกัด</span>
                                    </div>
                                </div>
                            );
                        }

                        if (!entitlement) return null;

                        const remaining = entitlement.entitledDays + entitlement.carryOverDays - entitlement.usedDays - entitlement.pendingDays;
                        const total = entitlement.entitledDays + entitlement.carryOverDays;
                        const usedPercentage = total > 0
                            ? ((entitlement.usedDays + entitlement.pendingDays) / total) * 100
                            : 0;

                        return (
                            <div key={type.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${type.color || 'bg-gray-400'}`} />
                                        <span className="text-sm text-foreground">{type.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-foreground">
                                            {remaining}
                                        </span>
                                        <span className="text-xs text-muted-foreground">/ {total} วัน</span>
                                    </div>
                                </div>
                                <Progress value={usedPercentage} className="h-1.5" />
                                {entitlement.pendingDays > 0 && (
                                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                                        รออนุมัติ {entitlement.pendingDays} วัน
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Request Button */}
            <Link href="/leave/request">
                <Button className="w-full h-12 text-base font-semibold shadow-lg">
                    <Plus className="h-5 w-5 mr-2" />
                    ขอลางานใหม่
                </Button>
            </Link>

            {/* Leave History */}
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
                    <TabsTrigger value="pending">รออนุมัติ</TabsTrigger>
                    <TabsTrigger value="approved">อนุมัติแล้ว</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4 space-y-3">
                    {requests.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">ไม่มีประวัติการลา</p>}
                    {requests.map(renderLeaveCard)}
                </TabsContent>

                <TabsContent value="pending" className="mt-4 space-y-3">
                    {requests
                        .filter((r) => r.status === "pending")
                        .map(renderLeaveCard)}
                    {requests.filter((r) => r.status === "pending").length === 0 && <p className="text-center text-sm text-muted-foreground py-4">ไม่มีรายการรออนุมัติ</p>}
                </TabsContent>

                <TabsContent value="approved" className="mt-4 space-y-3">
                    {requests
                        .filter((r) => r.status === "approved")
                        .map(renderLeaveCard)}
                    {requests.filter((r) => r.status === "approved").length === 0 && <p className="text-center text-sm text-muted-foreground py-4">ไม่มีรายการที่อนุมัติแล้ว</p>}
                </TabsContent>
            </Tabs>
        </div>
    );
}
