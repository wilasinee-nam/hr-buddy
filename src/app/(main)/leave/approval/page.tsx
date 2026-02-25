"use client";

import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    ClipboardCheck,
    Clock,
    CheckCircle2,
    XCircle,
    Calendar,
    FileText,
    ChevronRight,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useStore } from "@/store/useStore";
import { getLeavesForApproval, approveLeaveRequest } from "@/actions/leave-approvals";

interface LeaveRequest {
    id: number;
    userId: number;
    leaveTypeId: number;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    reason: string;
    status: string;
    submittedAt: Date;
    user: {
        name: string | null;
        employeeId?: string | null;
        departmentRel?: { name: string } | null;
        positionRel?: { name: string } | null;
        pictureUrl?: string | null;
    };
    leaveType: {
        name: string;
        color: string | null;
    };
    approvedAt?: Date | null;
    rejectionReason?: string | null;
}

export default function LeaveApprovalPage() {
    const { user } = useStore();
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("pending");
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user?.id) {
            fetchRequests();
        }
    }, [user?.id]);

    const fetchRequests = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await getLeavesForApproval(user.id);
            // Transform dates from string to Date object if needed (server actions return JSON dates as strings usually, but Prisma returns Date objects)
            // Next.js server actions serialize Dates as strings.
            const formattedData = data.map(item => ({
                ...item,
                startDate: new Date(item.startDate),
                endDate: new Date(item.endDate),
                submittedAt: new Date(item.createdAt), // mapping createdAt to submittedAt
                approvedAt: item.approvedAt ? new Date(item.approvedAt) : null,
            })) as unknown as LeaveRequest[];

            setRequests(formattedData);
        } catch (error) {
            console.error("Failed to fetch requests", error);
            toast.error("ไม่สามารถดึงข้อมูลคำขอลาได้");
        } finally {
            setLoading(false);
        }
    };

    const pendingRequests = requests.filter(r => r.status === "pending");
    const historyRequests = requests.filter(r => r.status !== "pending");

    const handleAction = async (status: "approved" | "rejected") => {
        if (!selectedRequest || !user?.id) return;

        try {
            setSubmitting(true);
            const result = await approveLeaveRequest(
                selectedRequest.id,
                user.id,
                status,
                comment
            );

            if (result.success) {
                toast.success(status === "approved" ? "อนุมัติใบลาเรียบร้อย" : "ปฏิเสธใบลาเรียบร้อย");
                setIsDetailOpen(false);
                setComment("");
                // Refresh list
                fetchRequests();
            } else {
                toast.error(`เกิดข้อผิดพลาด: ${result.error}`);
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการทำรายการ");
        } finally {
            setSubmitting(false);
        }
    };

    const openDetail = (request: LeaveRequest) => {
        setSelectedRequest(request);
        setComment("");
        setIsDetailOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge className="bg-warning/10 text-warning border-warning/20">รออนุมัติ</Badge>;
            case "approved":
                return <Badge className="bg-success/10 text-success border-success/20">อนุมัติแล้ว</Badge>;
            case "rejected":
                return <Badge className="bg-destructive/10 text-destructive border-destructive/20">ไม่อนุมัติ</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    <h1 className="text-lg font-bold text-foreground">อนุมัติใบลา</h1>
                </div>
                {pendingRequests.length > 0 && (
                    <Badge className="bg-warning text-warning-foreground">
                        {pendingRequests.length} รายการ
                    </Badge>
                )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending" className="text-xs flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        รออนุมัติ ({pendingRequests.length})
                    </TabsTrigger>
                    <TabsTrigger value="history" className="text-xs flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        ประวัติ ({historyRequests.length})
                    </TabsTrigger>
                </TabsList>

                {/* Pending Tab */}
                <TabsContent value="pending" className="space-y-3 mt-3">
                    {pendingRequests.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <CheckCircle2 className="h-12 w-12 text-success/50 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">ไม่มีรายการรออนุมัติ</p>
                            </CardContent>
                        </Card>
                    ) : (
                        pendingRequests.map((request) => (
                            <Card
                                key={request.id}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => openDetail(request)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={request.user.pictureUrl || ""} />
                                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                                {request.user.name?.slice(0, 2) || "??"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-semibold">{request.user.name}</p>
                                                <Badge className={`text-[10px] ${request.leaveType.color || "bg-gray-500"}`}>
                                                    {request.leaveType.name}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                {request.user.positionRel?.name || "-"} • {request.user.departmentRel?.name || "-"}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs">
                                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>
                                                    {format(request.startDate, "d MMM", { locale: th })}
                                                    {request.totalDays > 1 && ` - ${format(request.endDate, "d MMM", { locale: th })}`}
                                                </span>
                                                <Badge variant="secondary" className="text-[10px]">
                                                    {request.totalDays} วัน
                                                </Badge>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-3 mt-3">
                    {historyRequests.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">ยังไม่มีประวัติการอนุมัติ</p>
                            </CardContent>
                        </Card>
                    ) : (
                        historyRequests.map((request) => (
                            <Card
                                key={request.id}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => openDetail(request)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={request.user.pictureUrl || ""} />
                                            <AvatarFallback className={`text-sm ${request.status === "approved"
                                                ? "bg-success/10 text-success"
                                                : "bg-destructive/10 text-destructive"
                                                }`}>
                                                {request.user.name?.slice(0, 2) || "??"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-semibold">{request.user.name}</p>
                                                {getStatusBadge(request.status)}
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-1">
                                                {request.leaveType.name} • {request.totalDays} วัน
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {format(request.startDate, "d MMM yyyy", { locale: th })}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>

            {/* Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>รายละเอียดใบลา</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4">
                            {/* Employee Info */}
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={selectedRequest.user.pictureUrl || ""} />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {selectedRequest.user.name?.slice(0, 2) || "??"}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{selectedRequest.user.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedRequest.user.positionRel?.name || "-"} • {selectedRequest.user.departmentRel?.name || "-"}
                                    </p>
                                </div>
                            </div>

                            {/* Leave Details */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">ประเภทการลา</span>
                                    <Badge className={selectedRequest.leaveType.color || "bg-gray-500"}>
                                        {selectedRequest.leaveType.name}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">วันที่ลา</span>
                                    <span className="text-sm font-medium">
                                        {format(selectedRequest.startDate, "d MMM yyyy", { locale: th })}
                                        {selectedRequest.totalDays > 1 && ` - ${format(selectedRequest.endDate, "d MMM yyyy", { locale: th })}`}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">จำนวนวัน</span>
                                    <Badge variant="secondary">{selectedRequest.totalDays} วัน</Badge>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">เหตุผล</span>
                                    <p className="text-sm mt-1 p-2 bg-muted/30 rounded">{selectedRequest.reason}</p>
                                </div>
                            </div>

                            {/* Action Buttons (only for pending) */}
                            {selectedRequest.status === "pending" && (
                                <div className="pt-3 border-t space-y-3">
                                    <div className="space-y-2">
                                        <Label>หมายเหตุ (ถ้ามี)</Label>
                                        <Textarea
                                            placeholder="เพิ่มหมายเหตุ..."
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                            onClick={() => handleAction("rejected")}
                                            disabled={submitting}
                                        >
                                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
                                            ไม่อนุมัติ
                                        </Button>
                                        <Button
                                            className="bg-success hover:bg-success/90"
                                            onClick={() => handleAction("approved")}
                                            disabled={submitting}
                                        >
                                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                                            อนุมัติ
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Rejection Reason (if rejected/approved with comment) */}
                            {selectedRequest.rejectionReason && (
                                <div className="pt-3 border-t">
                                    <span className="text-sm text-muted-foreground">เหตุผลการอนุมัติ/ไม่อนุมัติ</span>
                                    <p className="text-sm mt-1 p-2 bg-muted/30 rounded">{selectedRequest.rejectionReason}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

