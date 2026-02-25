"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Edit2, Calendar, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
    LeaveType,
    EmployeeLeaveEntitlement,
    DEFAULT_LEAVE_TYPES,
    getRemainingDays,
} from "@/types/leave";

// Mock employee data
const mockEmployee = {
    id: "1",
    name: "สมชาย ใจดี",
    position: "พนักงานขาย",
    department: "ฝ่ายขาย",
    startDate: "2023-01-15",
};

// Mock entitlements
const mockEntitlements: EmployeeLeaveEntitlement[] = [
    {
        id: "1",
        employeeId: "1",
        leaveTypeId: "sick",
        year: 2025,
        entitledDays: 30,
        usedDays: 2,
        pendingDays: 0,
        carryOverDays: 0,
    },
    {
        id: "2",
        employeeId: "1",
        leaveTypeId: "personal",
        year: 2025,
        entitledDays: 3,
        usedDays: 1,
        pendingDays: 0,
        carryOverDays: 0,
    },
    {
        id: "3",
        employeeId: "1",
        leaveTypeId: "vacation",
        year: 2025,
        entitledDays: 6,
        usedDays: 3,
        pendingDays: 2,
        carryOverDays: 2,
    },
    {
        id: "4",
        employeeId: "1",
        leaveTypeId: "maternity",
        year: 2025,
        entitledDays: 98,
        usedDays: 0,
        pendingDays: 0,
        carryOverDays: 0,
    },
    {
        id: "5",
        employeeId: "1",
        leaveTypeId: "ordination",
        year: 2025,
        entitledDays: 15,
        usedDays: 0,
        pendingDays: 0,
        carryOverDays: 0,
    },
    {
        id: "6",
        employeeId: "1",
        leaveTypeId: "training",
        year: 2025,
        entitledDays: 5,
        usedDays: 0,
        pendingDays: 0,
        carryOverDays: 0,
    },
];

export default function EmployeeLeaveEntitlementsPage() {
    const { employeeId } = useParams();
    const [entitlements, setEntitlements] = useState(mockEntitlements);
    const [leaveTypes] = useState<LeaveType[]>(DEFAULT_LEAVE_TYPES);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEntitlement, setEditingEntitlement] =
        useState<EmployeeLeaveEntitlement | null>(null);
    const [formData, setFormData] = useState({
        entitledDays: 0,
        carryOverDays: 0,
    });

    const years = [2024, 2025, 2026];

    const getLeaveType = (typeId: string) => {
        return leaveTypes.find((t) => t.id === typeId);
    };

    const handleEdit = (entitlement: EmployeeLeaveEntitlement) => {
        setEditingEntitlement(entitlement);
        setFormData({
            entitledDays: entitlement.entitledDays,
            carryOverDays: entitlement.carryOverDays,
        });
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (editingEntitlement) {
            setEntitlements(
                entitlements.map((e) =>
                    e.id === editingEntitlement.id
                        ? { ...e, ...formData }
                        : e
                )
            );
            toast.success("อัปเดตสิทธิ์การลาเรียบร้อยแล้ว");
        }
        setIsDialogOpen(false);
    };

    const handleResetYear = () => {
        // Reset all entitlements for the selected year based on default leave types
        const updatedEntitlements = entitlements.map((e) => {
            const leaveType = getLeaveType(e.leaveTypeId);
            return {
                ...e,
                entitledDays: leaveType?.defaultDays ?? 0,
                usedDays: 0,
                pendingDays: 0,
                carryOverDays: 0,
            };
        });
        setEntitlements(updatedEntitlements);
        toast.success(`รีเซ็ตสิทธิ์การลาปี ${selectedYear} เรียบร้อยแล้ว`);
    };

    const filteredEntitlements = entitlements.filter(
        (e) => e.year === selectedYear
    );

    return (
        <>
            <div className="bg-primary text-primary-foreground p-4">
                <div className="flex items-center gap-3">
                    <Link href="/employees">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-primary-foreground hover:bg-primary-foreground/10"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-lg font-semibold">สิทธิ์การลา</h1>
                        <p className="text-sm opacity-80">{mockEmployee.name}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Employee Info */}
                <Card className="border-none shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-foreground">
                                    {mockEmployee.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {mockEmployee.position} • {mockEmployee.department}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    เริ่มงาน: {mockEmployee.startDate}
                                </p>
                            </div>
                            <Badge variant="outline">
                                <Calendar className="h-3 w-3 mr-1" />
                                {selectedYear}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Year Selector & Reset */}
                <div className="flex gap-2">
                    <Select
                        value={selectedYear.toString()}
                        onValueChange={(v) => setSelectedYear(parseInt(v))}
                    >
                        <SelectTrigger className="flex-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                    ปี {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleResetYear}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        รีเซ็ตปี
                    </Button>
                </div>

                {/* Entitlements List */}
                <div className="space-y-3">
                    {filteredEntitlements.map((entitlement) => {
                        const leaveType = getLeaveType(entitlement.leaveTypeId);
                        if (!leaveType || !leaveType.isActive) return null;

                        const remaining = getRemainingDays(entitlement);
                        const totalAvailable =
                            entitlement.entitledDays + entitlement.carryOverDays;
                        const usedPercentage =
                            totalAvailable > 0
                                ? ((entitlement.usedDays + entitlement.pendingDays) /
                                    totalAvailable) *
                                100
                                : 0;

                        return (
                            <Card key={entitlement.id} className="border-none shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-3 h-3 rounded-full ${leaveType.color}`}
                                            />
                                            <div>
                                                <p className="font-semibold text-foreground">
                                                    {leaveType.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {leaveType.description}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(entitlement)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                        <Progress value={usedPercentage} className="h-2" />
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                ใช้ไป {entitlement.usedDays} วัน
                                                {entitlement.pendingDays > 0 && (
                                                    <span className="text-warning">
                                                        {" "}
                                                        (รออนุมัติ {entitlement.pendingDays})
                                                    </span>
                                                )}
                                            </span>
                                            <span className="font-semibold text-foreground">
                                                เหลือ {remaining} วัน
                                            </span>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="mt-3 flex gap-2 flex-wrap">
                                        <Badge variant="secondary" className="text-xs">
                                            สิทธิ์ประจำปี: {entitlement.entitledDays} วัน
                                        </Badge>
                                        {entitlement.carryOverDays > 0 && (
                                            <Badge variant="outline" className="text-xs">
                                                ยกมา: {entitlement.carryOverDays} วัน
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            แก้ไขสิทธิ์การลา -{" "}
                            {editingEntitlement &&
                                getLeaveType(editingEntitlement.leaveTypeId)?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>จำนวนวันสิทธิ์ประจำปี</Label>
                            <Input
                                type="number"
                                value={formData.entitledDays}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        entitledDays: parseInt(e.target.value) || 0,
                                    })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>วันลายกมาจากปีก่อน</Label>
                            <Input
                                type="number"
                                value={formData.carryOverDays}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        carryOverDays: parseInt(e.target.value) || 0,
                                    })
                                }
                            />
                        </div>

                        {editingEntitlement && (
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    ใช้ไปแล้ว: {editingEntitlement.usedDays} วัน
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    รออนุมัติ: {editingEntitlement.pendingDays} วัน
                                </p>
                                <p className="text-sm font-semibold text-foreground mt-1">
                                    คงเหลือ:{" "}
                                    {formData.entitledDays +
                                        formData.carryOverDays -
                                        editingEntitlement.usedDays -
                                        editingEntitlement.pendingDays}{" "}
                                    วัน
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                className="flex-1"
                            >
                                ยกเลิก
                            </Button>
                            <Button onClick={handleSave} className="flex-1">
                                บันทึก
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
