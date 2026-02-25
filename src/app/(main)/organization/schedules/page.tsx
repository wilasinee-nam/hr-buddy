"use client";

import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    Clock,
    Plus,
    Pencil,
    Trash2,
    Calendar,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import {
    getWorkSchedules,
    createWorkSchedule,
    updateWorkSchedule,
    deleteWorkSchedule,
    setWorkScheduleDefault,
    WorkScheduleData
} from "@/actions/work-schedules";

// Mock interface to match what the component expects, but mapped from Prisma result
interface WorkSchedule {
    id: number;
    organizationId: number;
    name: string;
    startTime: string;
    endTime: string;
    lunchStart: string | null;
    lunchEnd: string | null;
    workDays: number[];
    isDefault: boolean;
}

const dayNames = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const fullDayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

interface ScheduleFormProps {
    formData: WorkScheduleData;
    setFormData: (data: WorkScheduleData) => void;
    onSubmit: () => void;
    submitLabel: string;
    submitting: boolean;
}

const ScheduleForm = ({
    formData,
    setFormData,
    onSubmit,
    submitLabel,
    submitting
}: ScheduleFormProps) => {
    const toggleWorkDay = (day: number) => {
        setFormData({
            ...formData,
            workDays: formData.workDays.includes(day)
                ? formData.workDays.filter(d => d !== day)
                : [...formData.workDays, day].sort()
        });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>ชื่อกะ *</Label>
                <Input
                    placeholder="เช่น กะปกติ, กะเช้า, กะบ่าย"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label className="text-xs">เริ่มงาน</Label>
                    <Input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs">เลิกงาน</Label>
                    <Input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label className="text-xs">พักเที่ยง (เริ่ม)</Label>
                    <Input
                        type="time"
                        value={formData.lunchStart || ""}
                        onChange={(e) => setFormData({ ...formData, lunchStart: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs">พักเที่ยง (สิ้นสุด)</Label>
                    <Input
                        type="time"
                        value={formData.lunchEnd || ""}
                        onChange={(e) => setFormData({ ...formData, lunchEnd: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-xs">วันทำงาน</Label>
                <div className="flex justify-between">
                    {dayNames.map((day, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => toggleWorkDay(index)}
                            className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${formData.workDays.includes(index)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                                }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            <Button onClick={onSubmit} className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitLabel}
            </Button>
        </div>
    );
};

export default function WorkSchedulesPage() {
    const { user } = useStore();
    const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<WorkScheduleData>({
        name: "",
        startTime: "08:30",
        endTime: "17:30",
        lunchStart: "12:00",
        lunchEnd: "13:00",
        workDays: [1, 2, 3, 4, 5],
    });

    useEffect(() => {
        if (user?.organizationId) {
            fetchSchedules();
        }
    }, [user?.organizationId]);

    const fetchSchedules = async () => {
        if (!user?.organizationId) return;
        try {
            setLoading(true);
            const data = await getWorkSchedules(user.organizationId);
            // Prisma returns Json for workDays, need to cast it
            const formattedData = data.map(s => ({
                ...s,
                workDays: s.workDays as number[],
            }));
            setSchedules(formattedData);
        } catch (error) {
            console.error("Failed to fetch schedules:", error);
            toast.error("ไม่สามารถดึงข้อมูลกะการทำงานได้");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            startTime: "08:30",
            endTime: "17:30",
            lunchStart: "12:00",
            lunchEnd: "13:00",
            workDays: [1, 2, 3, 4, 5],
        });
    };



    const handleAdd = async () => {
        if (!user?.organizationId) return;
        if (!formData.name.trim()) {
            toast.error("กรุณาระบุชื่อกะการทำงาน");
            return;
        }

        try {
            setSubmitting(true);
            const result = await createWorkSchedule(user.organizationId, formData);
            if (result.success) {
                toast.success("เพิ่มกะการทำงานใหม่เรียบร้อยแล้ว");
                resetForm();
                setIsAddOpen(false);
                fetchSchedules();
            } else {
                toast.error(`เกิดข้อผิดพลาด: ${result.error}`);
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async () => {
        if (!selectedSchedule) return;
        if (!formData.name.trim()) {
            toast.error("กรุณาระบุชื่อกะการทำงาน");
            return;
        }

        try {
            setSubmitting(true);
            const result = await updateWorkSchedule(selectedSchedule.id, formData);
            if (result.success) {
                toast.success("แก้ไขข้อมูลกะการทำงานเรียบร้อยแล้ว");
                resetForm();
                setIsEditOpen(false);
                setSelectedSchedule(null);
                fetchSchedules();
            } else {
                toast.error(`เกิดข้อผิดพลาด: ${result.error}`);
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (scheduleId: number) => {
        if (!confirm("คุณต้องการลบกะการทำงานนี้ใช่หรือไม่?")) return;

        try {
            const result = await deleteWorkSchedule(scheduleId);
            if (result.success) {
                toast.success("ลบกะการทำงานเรียบร้อยแล้ว");
                fetchSchedules();
            } else {
                toast.error(`ไม่สามารถลบได้: ${result.error}`);
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
        }
    };

    const setAsDefault = async (scheduleId: number) => {
        if (!user?.organizationId) return;
        try {
            const result = await setWorkScheduleDefault(user.organizationId, scheduleId);
            if (result.success) {
                toast.success("ตั้งเป็นกะเริ่มต้นเรียบร้อยแล้ว");
                fetchSchedules();
            } else {
                toast.error(`เกิดข้อผิดพลาด: ${result.error}`);
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการตั้งค่า");
        }
    };

    const openEditDialog = (schedule: WorkSchedule) => {
        setSelectedSchedule(schedule);
        setFormData({
            name: schedule.name,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            lunchStart: schedule.lunchStart || "", // Handle null
            lunchEnd: schedule.lunchEnd || "",     // Handle null
            workDays: schedule.workDays,
        });
        setIsEditOpen(true);
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
                    <Clock className="h-5 w-5 text-primary" />
                    <h1 className="text-lg font-bold text-foreground">กำหนดเวลาทำงาน</h1>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={resetForm}>
                            <Plus className="h-4 w-4 mr-1" />
                            เพิ่มกะ
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>เพิ่มกะการทำงานใหม่</DialogTitle>
                        </DialogHeader>
                        <ScheduleForm
                            formData={formData}
                            setFormData={setFormData}
                            onSubmit={handleAdd}
                            submitLabel="เพิ่มกะการทำงาน"
                            submitting={submitting}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary */}
            <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                    ทั้งหมด {schedules.length} กะ
                </Badge>
            </div>

            {/* Schedule List */}
            <div className="space-y-3">
                {schedules.map((schedule) => (
                    <Card key={schedule.id} className={`border-none shadow-sm ${schedule.isDefault ? 'ring-2 ring-primary/20' : ''}`}>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-foreground">
                                            {schedule.name}
                                        </p>
                                        {schedule.isDefault && (
                                            <Badge className="bg-primary/10 text-primary text-[10px]">
                                                ค่าเริ่มต้น
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-sm font-medium text-primary">
                                            {schedule.startTime} - {schedule.endTime}
                                        </span>
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        พัก {schedule.lunchStart || "-"} - {schedule.lunchEnd || "-"}
                                    </p>

                                    <div className="flex gap-1">
                                        {schedule.workDays.map(day => (
                                            <Badge key={day} variant="outline" className="text-[10px] px-1.5 py-0">
                                                {fullDayNames[day]}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => openEditDialog(schedule)}
                                        >
                                            <Pencil className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleDelete(schedule.id)}
                                            disabled={schedule.isDefault}
                                        >
                                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                    {!schedule.isDefault && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-[10px] h-6"
                                            onClick={() => setAsDefault(schedule.id)}
                                        >
                                            ตั้งเป็นค่าเริ่มต้น
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>แก้ไขกะการทำงาน</DialogTitle>
                    </DialogHeader>
                    <ScheduleForm
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleEdit}
                        submitLabel="บันทึกการแก้ไข"
                        submitting={submitting}
                    />
                </DialogContent>
            </Dialog>

            {schedules.length === 0 && !loading && (
                <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">ยังไม่มีกะการทำงาน</p>
                    <p className="text-xs text-muted-foreground">กดปุ่ม "เพิ่มกะ" เพื่อเริ่มต้น</p>
                </div>
            )}
        </div>
    );
}


