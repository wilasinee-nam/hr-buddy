"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Building2,
    Users,
    Plus,
    ChevronRight,
    UserCheck,
    Trash2,
    Settings2,
    X,
    MapPin,
    Clock,
    Calendar,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import {
    getOrganizationDetails,
    createDepartment,
    deleteDepartment,
    addApproverToDepartment,
    removeApproverFromDepartment
} from "@/actions/organization";

interface Approver {
    id: number;
    name: string;
    position: string;
    level: number;
}

interface Department {
    id: number;
    name: string;
    approvalChain: Approver[];
    userCount: number;
}

interface Employee {
    id: number;
    name: string;
    position: string;
    departmentId: number | null;
    canBeApprover: boolean;
    pictureUrl?: string | null;
}

export default function OrganizationPage() {
    const { user } = useStore();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
    const [isEditApprovalOpen, setIsEditApprovalOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    const [newDeptName, setNewDeptName] = useState("");
    const [selectedApprover, setSelectedApprover] = useState<string>("none");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user?.organizationId) {
            fetchData();
        } else if (user && !user.organizationId) {
            setLoading(false);
        }
    }, [user, user?.organizationId]);

    const fetchData = async () => {
        if (!user?.organizationId) return;
        try {
            setLoading(true);
            const result = await getOrganizationDetails(user.organizationId);
            if (result.success && result.data) {
                // Transform data for UI
                const depts = result.data.departments.map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    userCount: d._count.users,
                    approvalChain: d.departmentApprovers.map((da: any) => ({
                        id: da.approver.id,
                        name: da.approver.name,
                        position: da.approver.positionRel?.name || "-",
                        level: da.order
                    }))
                }));
                setDepartments(depts);

                const emps = result.data.users.map((u: any) => ({
                    id: u.id,
                    name: u.name,
                    position: u.positionRel?.name || "-",
                    departmentId: u.departmentId,
                    canBeApprover: true, // simplified logic for now
                    pictureUrl: u.pictureUrl
                }));
                setEmployees(emps);
            }
        } catch (error) {
            console.error("Failed to fetch organization data", error);
            toast.error("ไม่สามารถดึงข้อมูลองค์กรได้");
        } finally {
            setLoading(false);
        }
    };

    const handleAddDepartment = async () => {
        if (!newDeptName.trim() || !user?.organizationId) {
            toast.error("กรุณาระบุชื่อแผนก");
            return;
        }

        try {
            setSubmitting(true);
            const result = await createDepartment(user.organizationId, newDeptName);
            if (result.success) {
                toast.success("เพิ่มแผนกใหม่เรียบร้อยแล้ว");
                setNewDeptName("");
                setIsAddDeptOpen(false);
                fetchData();
            } else {
                toast.error(`เกิดข้อผิดพลาด: ${result.error}`);
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการเพิ่มแผนก");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteDepartment = async (deptId: number) => {
        if (!confirm("คุณต้องการลบแผนกนี้ใช่หรือไม่?")) return;

        const hasEmployees = employees.some(e => e.departmentId === deptId);
        if (hasEmployees) {
            toast.error("ไม่สามารถลบแผนกที่มีพนักงานอยู่ได้");
            return;
        }

        try {
            const result = await deleteDepartment(deptId);
            if (result.success) {
                toast.success("ลบแผนกเรียบร้อยแล้ว");
                fetchData();
            } else {
                toast.error(`ไม่สามารถลบได้: ${result.error}`);
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการลบแผนก");
        }
    };

    const openApprovalDialog = (dept: Department) => {
        setSelectedDepartment(dept);
        setSelectedApprover("none");
        setIsEditApprovalOpen(true);
    };

    const handleAddApprover = async () => {
        if (!selectedDepartment || selectedApprover === "none") return;

        const approverId = parseInt(selectedApprover);
        // Check if already in chain
        if (selectedDepartment.approvalChain.some(a => a.id === approverId)) {
            toast.error("ผู้อนุมัติคนนี้อยู่ในสายอนุมัติแล้ว");
            return;
        }

        try {
            setSubmitting(true);
            const order = selectedDepartment.approvalChain.length + 1;
            const result = await addApproverToDepartment(selectedDepartment.id, approverId, order);

            if (result.success) {
                toast.success("เพิ่มผู้อนุมัติเรียบร้อยแล้ว");
                setSelectedApprover("none");
                // Refresh data to update local state too
                await fetchData();
                // Update selected department state from new data
                // We need to find the updated department from the list we just fetched
                // But since state update is async, we might not have it yet.
                // A better way is to refetch and then find it in the new list.
                // For simplicity, we just close dialog or let user reopen, but better UX is stay open.
                // Let's implement a quick re-find
                const updatedDept = departments.find(d => d.id === selectedDepartment.id); // This will still be old
                // So actually, let's just trigger fetch and rely on React to update,
                // but we need to update selectedDepartments manually or close dialog.
                // Let's manually update selectedDept for smooth UX:
                const employee = employees.find(e => e.id === approverId);
                if (employee) {
                    const newApp: Approver = {
                        id: employee.id,
                        name: employee.name,
                        position: employee.position,
                        level: order
                    };
                    setSelectedDepartment({
                        ...selectedDepartment,
                        approvalChain: [...selectedDepartment.approvalChain, newApp]
                    });
                }
            } else {
                toast.error(`เกิดข้อผิดพลาด: ${result.error}`);
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการเพิ่มผู้อนุมัติ");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveApprover = async (approverId: number) => {
        if (!selectedDepartment) return;

        try {
            const result = await removeApproverFromDepartment(selectedDepartment.id, approverId);

            if (result.success) {
                toast.success("ลบผู้อนุมัติแล้ว");
                await fetchData();
                // Update local selected state
                const updatedChain = selectedDepartment.approvalChain
                    .filter(a => a.id !== approverId)
                    .map((a, index) => ({ ...a, level: index + 1 }));

                setSelectedDepartment({
                    ...selectedDepartment,
                    approvalChain: updatedChain
                });
            } else {
                toast.error(`เกิดข้อผิดพลาด: ${result.error}`);
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการลบผู้อนุมัติ");
        }
    };


    // Removed full page loading to allow header to show

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold text-foreground">โครงสร้างองค์กร</h1>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-3 gap-3">
                <Link href="/organization/branches">
                    <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                        <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold">จัดการสาขา</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/organization/schedules">
                    <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                        <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold">กะการทำงาน</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/leave/settings">
                    <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                        <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold">ประเภทลา</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>


            {/* Departments & Approval Chains */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            แผนกและสายอนุมัติ
                        </CardTitle>
                        <Dialog open={isAddDeptOpen} onOpenChange={setIsAddDeptOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="h-7 text-xs">
                                    <Plus className="h-3 w-3 mr-1" />
                                    เพิ่มแผนก
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>เพิ่มแผนกใหม่</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>ชื่อแผนก</Label>
                                        <Input
                                            placeholder="ชื่อแผนก"
                                            value={newDeptName}
                                            onChange={(e) => setNewDeptName(e.target.value)}
                                        />
                                    </div>
                                    <Button onClick={handleAddDepartment} className="w-full" disabled={submitting}>
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        เพิ่มแผนก
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
                        </div>
                    ) : departments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีแผนก</p>
                    ) : (
                        departments.map((dept) => (
                            <div
                                key={dept.id}
                                className="p-3 bg-muted/50 rounded-lg space-y-2"
                            >
                                {/* Department Header */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold">{dept.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {dept.userCount} พนักงาน
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => openApprovalDialog(dept)}
                                        >
                                            <Settings2 className="h-3.5 w-3.5 text-primary" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => handleDeleteDepartment(dept.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Approval Chain */}
                                <div className="pt-2 border-t border-border/50">
                                    <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                                        <UserCheck className="h-3 w-3" />
                                        สายอนุมัติ:
                                    </p>
                                    {dept.approvalChain.length === 0 ? (
                                        <p className="text-xs text-destructive">⚠️ ยังไม่ได้กำหนดสายอนุมัติ</p>
                                    ) : (
                                        <div className="flex items-center flex-wrap gap-1">
                                            {dept.approvalChain.map((approver, index) => (
                                                <div key={approver.id} className="flex items-center">
                                                    <Badge
                                                        variant="secondary"
                                                        className={`text-[10px] px-2 py-0.5 ${index === 0
                                                            ? 'bg-primary/10 text-primary border border-primary/20'
                                                            : 'bg-muted'
                                                            }`}
                                                    >
                                                        {approver.level}. {approver.name}
                                                    </Badge>
                                                    {index < dept.approvalChain.length - 1 && (
                                                        <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* All Approvers Summary */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        รายชื่อผู้มีสิทธิ์อนุมัติ
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {loading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
                        </div>
                    ) : employees.filter(e => e.canBeApprover).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            ยังไม่มีผู้มีสิทธิ์อนุมัติ
                        </p>
                    ) : (
                        employees.filter(e => e.canBeApprover).map((approver) => {
                            const dept = departments.find(d => d.id === approver.departmentId);
                            // Count how many departments this person approves for
                            const approvesForCount = departments.filter(d =>
                                d.approvalChain.some(a => a.id === approver.id)
                            ).length;

                            return (
                                <div
                                    key={approver.id}
                                    className="flex items-center gap-3 p-2.5 bg-green-50 rounded-lg border border-green-200"
                                >
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={approver.pictureUrl || ""} />
                                        <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                                            {approver.name.slice(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{approver.name}</p>
                                        <p className="text-xs text-muted-foreground">{approver.position}</p>
                                        {approvesForCount > 0 && (
                                            <p className="text-[10px] text-green-600 mt-0.5">
                                                อนุมัติให้ {approvesForCount} แผนก
                                            </p>
                                        )}
                                    </div>
                                    <Badge variant="outline" className="text-[10px]">
                                        {dept?.name || "ไม่ระบุแผนก"}
                                    </Badge>
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>

            {/* Employees by Department */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        พนักงานตามแผนก
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
                        </div>
                    ) : (
                        <>
                            {departments.map((dept) => {
                                const deptEmployees = employees.filter(e => e.departmentId === dept.id);
                                if (deptEmployees.length === 0) return null;

                                return (
                                    <div key={dept.id} className="space-y-1.5">
                                        <p className="text-xs font-medium text-muted-foreground">{dept.name}</p>
                                        {deptEmployees.map((employee) => (
                                            <div
                                                key={employee.id}
                                                className="flex items-center gap-2 p-2 bg-muted/30 rounded-md"
                                            >
                                                <Avatar className="h-7 w-7">
                                                    <AvatarImage src={employee.pictureUrl || ""} />
                                                    <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                                        {employee.name.slice(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium truncate">{employee.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">{employee.position}</p>
                                                </div>
                                                {employee.canBeApprover && (
                                                    <Badge className="bg-green-100 text-green-600 hover:bg-green-100 text-[10px] px-1.5 border-green-200">
                                                        อนุมัติได้
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                            {employees.filter(e => !e.departmentId).length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-medium text-muted-foreground">ไม่ระบุแผนก</p>
                                    {employees.filter(e => !e.departmentId).map((employee) => (
                                        <div
                                            key={employee.id}
                                            className="flex items-center gap-2 p-2 bg-muted/30 rounded-md"
                                        >
                                            <Avatar className="h-7 w-7">
                                                <AvatarImage src={employee.pictureUrl || ""} />
                                                <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                                    {employee.name.slice(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium truncate">{employee.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{employee.position}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Edit Approval Chain Dialog */}
            <Dialog open={isEditApprovalOpen} onOpenChange={setIsEditApprovalOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>ตั้งค่าสายอนุมัติ - {selectedDepartment?.name}</DialogTitle>
                    </DialogHeader>
                    {selectedDepartment && (
                        <div className="space-y-4">
                            {/* Current Chain */}
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">ลำดับการอนุมัติปัจจุบัน</Label>
                                {selectedDepartment.approvalChain.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
                                        ยังไม่ได้กำหนดผู้อนุมัติ
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedDepartment.approvalChain.map((approver) => (
                                            <div
                                                key={approver.id}
                                                className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                                        {approver.level}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{approver.name}</p>
                                                        <p className="text-xs text-muted-foreground">{approver.position}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => handleRemoveApprover(approver.id)}
                                                >
                                                    <X className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Add Approver */}
                            <div className="space-y-2 pt-2 border-t">
                                <Label>เพิ่มผู้อนุมัติ</Label>
                                <div className="flex gap-2">
                                    <Select
                                        value={selectedApprover}
                                        onValueChange={setSelectedApprover}
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="เลือกผู้อนุมัติ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- เลือกผู้อนุมัติ --</SelectItem>
                                            {employees
                                                .filter(e => e.canBeApprover && !selectedDepartment.approvalChain.some(a => a.id === e.id))
                                                .map((emp) => (
                                                    <SelectItem key={emp.id} value={emp.id.toString()}>
                                                        {emp.name} - {emp.position}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        onClick={handleAddApprover}
                                        disabled={selectedApprover === "none" || submitting}
                                        size="icon"
                                    >
                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    ผู้อนุมัติจะเรียงตามลำดับที่เพิ่ม (ระดับ 1 อนุมัติก่อน → ระดับ 2 → ...)
                                </p>
                            </div>

                            <Button
                                onClick={() => setIsEditApprovalOpen(false)}
                                className="w-full"
                            >
                                เสร็จสิ้น
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
