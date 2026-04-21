"use client";

import { useState, useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Pencil, Phone, Mail, UserCircle, Lock, MapPin, Clock, CalendarDays, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PermissionGate } from "@/components/PermissionGate";
import { usePermission } from "@/contexts/PermissionContext";
import { useStore } from "@/store/useStore";
import { getEmployees, getEmployeeFormData, createEmployee, updateEmployee, getTodayCheckinCount } from "@/actions/employees";

interface Employee {
    id: number;
    name: string | null;
    employeeId: string | null;
    position: string | null;
    department: string | null;
    departmentId: number | null;
    departmentRel: { id: number; name: string } | null;
    branchId: number | null;
    branchRel: { id: number; name: string } | null;
    positionId: number | null;
    positionRel: { id: number; name: string } | null;
    phoneNumber: string | null;
    email: string | null;
    status: string;
    startDate: Date | string | null;
    pictureUrl: string | null;
    vacationDays: number | null;
    workSchedules: { id: number; name: string; startTime: string; endTime: string }[];
    leaveEntitlements?: { leaveTypeId: number; entitledDays: number }[];
}

interface FormOption {
    id: number;
    name: string;
}

interface FormLeaveType {
    id: number;
    name: string;
    defaultDays: number | null;
}

interface FormSchedule {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
}

export default function EmployeesPage() {
    const user = useStore((state) => state.user);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<FormOption[]>([]);
    const [branches, setBranches] = useState<FormOption[]>([]);
    const [positions, setPositions] = useState<FormOption[]>([]);
    const [schedules, setSchedules] = useState<FormSchedule[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<FormLeaveType[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkinCount, setCheckinCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        employeeId: "",
        positionId: "",
        departmentId: "",
        branchId: "",
        scheduleId: "",
        phone: "",
        email: "",
        vacationDays: "",
        leaveEntitlements: {} as Record<string, string>,
    });

    const resetForm = () => {
        const defaultEntitlements: Record<string, string> = {};
        leaveTypes.forEach(t => {
            if (t.defaultDays !== null) {
                defaultEntitlements[t.id] = t.defaultDays.toString();
            }
        });
        setFormData({ name: "", employeeId: "", positionId: "", departmentId: "", branchId: "", scheduleId: "", phone: "", email: "", vacationDays: "", leaveEntitlements: defaultEntitlements });
    };

    const fetchData = async () => {
        if (!user?.organizationId) return;
        try {
            const [empRes, formRes, checkinRes] = await Promise.all([
                getEmployees(user.organizationId),
                getEmployeeFormData(user.organizationId),
                getTodayCheckinCount(user.organizationId),
            ]);
            if (empRes.success && empRes.data) {
                setEmployees(empRes.data as Employee[]);
            }
            if (formRes.success && formRes.data) {
                setDepartments(formRes.data.departments);
                setBranches(formRes.data.branches);
                setPositions(formRes.data.positions);
                setSchedules(formRes.data.schedules);
                if (formRes.data.leaveTypes) setLeaveTypes(formRes.data.leaveTypes);
            }
            if (checkinRes.success) {
                setCheckinCount(checkinRes.count);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.organizationId) {
            fetchData();
        } else if (user && !user.organizationId) {
            setLoading(false);
        }
    }, [user, user?.organizationId]);

    const getBranchName = (employee: Employee) => employee.branchRel?.name || "-";
    const getDepartmentName = (employee: Employee) => employee.departmentRel?.name || employee.department || "-";
    const getPositionName = (employee: Employee) => employee.positionRel?.name || employee.position || "-";
    const getScheduleName = (employee: Employee) => employee.workSchedules?.[0]?.name || "-";

    const handleAdd = async () => {
        if (!user?.organizationId || !formData.name.trim()) return;
        setSubmitting(true);
        try {
            const parsedEntitlements: Record<string, number> = {};
            Object.entries(formData.leaveEntitlements).forEach(([id, val]) => {
                if (val !== "") parsedEntitlements[id] = parseFloat(val);
            });

            const result = await createEmployee(user.organizationId, {
                name: formData.name,
                employeeId: formData.employeeId || undefined,
                positionId: formData.positionId ? parseInt(formData.positionId) : undefined,
                departmentId: formData.departmentId ? parseInt(formData.departmentId) : undefined,
                branchId: formData.branchId ? parseInt(formData.branchId) : undefined,
                scheduleId: formData.scheduleId ? parseInt(formData.scheduleId) : undefined,
                phoneNumber: formData.phone || undefined,
                email: formData.email || undefined,
                vacationDays: formData.vacationDays ? parseInt(formData.vacationDays) : undefined,
                leaveEntitlements: parsedEntitlements,
            });
            if (result.success) {
                toast.success("เพิ่มพนักงานใหม่เรียบร้อยแล้ว");
                resetForm();
                setIsAddOpen(false);
                fetchData();
            } else {
                toast.error(result.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async () => {
        if (!selectedEmployee) return;
        setSubmitting(true);
        try {
            const parsedEntitlements: Record<string, number> = {};
            Object.entries(formData.leaveEntitlements).forEach(([id, val]) => {
                if (val !== "") parsedEntitlements[id] = parseFloat(val);
            });

            const result = await updateEmployee(selectedEmployee.id, {
                name: formData.name || undefined,
                employeeId: formData.employeeId || null,
                positionId: formData.positionId ? parseInt(formData.positionId) : null,
                departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
                branchId: formData.branchId ? parseInt(formData.branchId) : null,
                scheduleId: formData.scheduleId ? parseInt(formData.scheduleId) : null,
                phoneNumber: formData.phone || undefined,
                email: formData.email || undefined,
                vacationDays: formData.vacationDays ? parseInt(formData.vacationDays) : undefined,
                leaveEntitlements: parsedEntitlements,
            });
            if (result.success) {
                toast.success("แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว");
                resetForm();
                setIsEditOpen(false);
                setSelectedEmployee(null);
                fetchData();
            } else {
                toast.error(result.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setSubmitting(false);
        }
    };

    const openEditDialog = (employee: Employee) => {
        setSelectedEmployee(employee);
        const existingEntitlements: Record<string, string> = {};
        if (employee.leaveEntitlements) {
            employee.leaveEntitlements.forEach(e => {
                existingEntitlements[e.leaveTypeId] = e.entitledDays.toString();
            });
        }
        setFormData({
            name: employee.name || "",
            employeeId: employee.employeeId || "",
            positionId: employee.positionId?.toString() || "",
            departmentId: employee.departmentId?.toString() || "",
            branchId: employee.branchId?.toString() || "",
            scheduleId: employee.workSchedules?.[0]?.id?.toString() || "",
            phone: employee.phoneNumber || "",
            email: employee.email || "",
            vacationDays: employee.vacationDays?.toString() || "",
            leaveEntitlements: existingEntitlements,
        });
        setIsEditOpen(true);
    };

    const filteredEmployees = employees.filter(emp => {
        const name = emp.name?.toLowerCase() || "";
        const dept = getDepartmentName(emp).toLowerCase();
        const empId = emp.employeeId?.toLowerCase() || "";
        const query = searchQuery.toLowerCase();
        return name.includes(query) || dept.includes(query) || empId.includes(query);
    });

    const renderForm = (onSubmit: () => void, submitLabel: string) => (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-2">
                <Label>รหัสพนักงาน</Label>
                <Input
                    placeholder="EMP001"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                />
            </div>
            <div className="space-y-2">
                <Label>ชื่อ-นามสกุล <span className="text-destructive">*</span></Label>
                <Input
                    placeholder="ชื่อ-นามสกุล"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
            </div>
            <div className="space-y-2">
                <Label>ตำแหน่ง</Label>
                <Select
                    value={formData.positionId}
                    onValueChange={(value) => setFormData({ ...formData, positionId: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="เลือกตำแหน่ง" />
                    </SelectTrigger>
                    <SelectContent>
                        {positions.map((pos) => (
                            <SelectItem key={pos.id} value={pos.id.toString()}>{pos.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>แผนก</Label>
                <Select
                    value={formData.departmentId}
                    onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="เลือกแผนก" />
                    </SelectTrigger>
                    <SelectContent>
                        {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>สาขาที่ทำงาน</Label>
                <Select
                    value={formData.branchId}
                    onValueChange={(value) => setFormData({ ...formData, branchId: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="เลือกสาขา" />
                    </SelectTrigger>
                    <SelectContent>
                        {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id.toString()}>{branch.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>กะการทำงาน</Label>
                <Select
                    value={formData.scheduleId}
                    onValueChange={(value) => setFormData({ ...formData, scheduleId: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="เลือกกะการทำงาน" />
                    </SelectTrigger>
                    <SelectContent>
                        {schedules.map((schedule) => (
                            <SelectItem key={schedule.id} value={schedule.id.toString()}>
                                {schedule.name} ({schedule.startTime}-{schedule.endTime})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-4 pt-2 border-t mt-4 mb-2">
                <Label className="font-semibold text-foreground">สิทธิ์ลาพักร้อน และสิทธิ์การลางานอื่นๆ (วัน/ปี)</Label>
                {leaveTypes.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {leaveTypes.map((lt) => (
                            <div key={lt.id} className="space-y-1.5 shadow-sm p-3 rounded-md border bg-muted/20">
                                <Label className="text-xs text-muted-foreground">{lt.name}</Label>
                                <Input
                                    type="number"
                                    placeholder={lt.defaultDays !== null ? lt.defaultDays.toString() : "0"}
                                    min="0"
                                    step="0.5"
                                    value={formData.leaveEntitlements[lt.id] || ""}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        leaveEntitlements: {
                                            ...formData.leaveEntitlements,
                                            [lt.id]: e.target.value
                                        }
                                    })}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground italic">ไม่พบการตั้งค่าประเภทการลาในระบบ</p>
                )}
            </div>
            <div className="space-y-2">
                <Label>เบอร์โทร</Label>
                <Input
                    placeholder="0XX-XXX-XXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
            </div>
            <div className="space-y-2">
                <Label>อีเมล</Label>
                <Input
                    type="email"
                    placeholder="email@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
            </div>
            <Button onClick={onSubmit} className="w-full" disabled={submitting || !formData.name.trim()}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {submitLabel}
            </Button>
        </div>
    );

    const { hasPermission } = usePermission();

    // Check if user has permission to view this page
    if (!hasPermission("employees.view")) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] p-4">
                <Lock className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
                <p className="text-sm text-muted-foreground text-center">
                    คุณไม่มีสิทธิ์ในการดูหน้าจัดการพนักงาน กรุณาติดต่อผู้ดูแลระบบ
                </p>
            </div>
        );
    }

    return (

        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold text-foreground">จัดการพนักงาน</h1>
                <PermissionGate permission="employees.create">
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" onClick={resetForm}>
                                <Plus className="h-4 w-4 mr-1" />
                                เพิ่ม
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>เพิ่มพนักงานใหม่</DialogTitle>
                            </DialogHeader>
                            {renderForm(handleAdd, "เพิ่มพนักงาน")}
                        </DialogContent>
                    </Dialog>
                </PermissionGate>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="ค้นหาพนักงาน..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Stats */}
            <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                    ทั้งหมด {employees.length} คน
                </Badge>
                <Badge className="bg-success/10 text-success text-xs">
                    เช็คอินแล้ว {checkinCount} คน
                </Badge>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {/* Employee List */}
            {!loading && (
                <div className="space-y-2">
                    {filteredEmployees.map((employee) => (
                        <Card key={employee.id} className="border-none shadow-sm">
                            <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={employee.pictureUrl || ""} />
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {(employee.name || "?").slice(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-foreground truncate">
                                                {employee.name || "ไม่ระบุชื่อ"}
                                            </p>
                                            {employee.employeeId && (
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                                                    {employee.employeeId}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{getPositionName(employee)}</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                {getDepartmentName(employee)}
                                            </Badge>
                                            {employee.branchRel && (
                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex items-center gap-0.5">
                                                    <MapPin className="h-2.5 w-2.5" />
                                                    {getBranchName(employee)}
                                                </Badge>
                                            )}
                                            {employee.workSchedules?.[0] && (
                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex items-center gap-0.5">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {employee.workSchedules[0].startTime}-{employee.workSchedules[0].endTime}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <PermissionGate permission="employees.edit">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => openEditDialog(employee)}
                                            >
                                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </PermissionGate>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-2 pl-[60px]">
                                    {employee.phoneNumber && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Phone className="h-3 w-3" />
                                            <span>{employee.phoneNumber}</span>
                                        </div>
                                    )}
                                    {employee.email && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Mail className="h-3 w-3" />
                                            <span className="truncate">{employee.email}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>แก้ไขข้อมูลพนักงาน</DialogTitle>
                    </DialogHeader>
                    {renderForm(handleEdit, "บันทึกการแก้ไข")}
                </DialogContent>
            </Dialog>

            {!loading && filteredEmployees.length === 0 && (
                <div className="text-center py-8">
                    <UserCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">ไม่พบพนักงาน</p>
                </div>
            )}
        </div>

    );
}
