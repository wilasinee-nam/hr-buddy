"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    Plus,
    Edit2,
    Calendar,
    FileText,
    Clock,
    DollarSign,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { LeaveType } from "@prisma/client";
import { getLeaveTypes, createLeaveType, updateLeaveType, toggleLeaveTypeStatus } from "@/actions/leave-types";
import { useStore } from "@/store/useStore";

export default function LeaveSettingsPage() {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<LeaveType | null>(null);
    const [formData, setFormData] = useState<Partial<LeaveType>>({
        name: "",
        code: "",
        description: "",
        defaultDays: 0,
        maxPaidDays: 0,
        requiresDocument: false,
        requiresAdvanceNotice: false,
        advanceNoticeDays: 0,
        isActive: true,
        color: "bg-gray-500",
    });

    const organization = useStore((state) => state.organization);
    const organizationId = organization?.id;

    useEffect(() => {
        if (organizationId) {
            loadLeaveTypes();
        }
    }, [organizationId]);

    const loadLeaveTypes = async () => {
        setIsLoading(true);
        const data = await getLeaveTypes(organizationId);
        setLeaveTypes(data);
        setIsLoading(false);
    };

    const colorOptions = [
        "bg-red-500",
        "bg-blue-500",
        "bg-green-500",
        "bg-yellow-500",
        "bg-purple-500",
        "bg-pink-500",
        "bg-orange-500",
        "bg-cyan-500",
        "bg-amber-600",
        "bg-emerald-500",
    ];

    const handleEdit = (type: LeaveType) => {
        setEditingType(type);
        setFormData(type);
        setIsDialogOpen(true);
    };

    const handleAdd = () => {
        setEditingType(null);
        setFormData({
            name: "",
            code: "",
            description: "",
            defaultDays: 0,
            maxPaidDays: 0,
            requiresDocument: false,
            requiresAdvanceNotice: false,
            advanceNoticeDays: 0,
            isActive: true,
            color: "bg-gray-500",
        });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.code) {
            toast.error("กรุณากรอกชื่อและรหัสประเภทการลา");
            return;
        }

        try {
            if (editingType) {
                const result = await updateLeaveType(editingType.id, organizationId, formData);
                if (result.success) {
                    toast.success("แก้ไขประเภทการลาเรียบร้อยแล้ว");
                    loadLeaveTypes();
                } else {
                    toast.error(result.error);
                }
            } else {
                const result = await createLeaveType(organizationId, formData as any);
                if (result.success) {
                    toast.success("เพิ่มประเภทการลาเรียบร้อยแล้ว");
                    loadLeaveTypes();
                } else {
                    toast.error(result.error);
                }
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
    };

    const toggleActive = async (id: number) => {
        try {
            const result = await toggleLeaveTypeStatus(id, organizationId);
            if (result.success) {
                toast.success("อัปเดตสถานะเรียบร้อยแล้ว");
                // Optimistic update
                setLeaveTypes(prev => prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t));
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
        }
    };

    return (
        <>
            <div className="bg-primary text-primary-foreground p-4">
                <div className="flex items-center gap-3">
                    <Link href="/leave">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-primary-foreground hover:bg-primary-foreground/10"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-lg font-semibold">ตั้งค่าประเภทการลา</h1>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Info Card */}
                <Card className="border-none shadow-sm bg-info/10">
                    <CardContent className="p-4">
                        <p className="text-sm text-info">
                            กำหนดประเภทการลาและสิทธิ์พื้นฐานตามกฎหมายแรงงาน
                            สามารถปรับแต่งสิทธิ์เพิ่มเติมได้ในหน้าพนักงานแต่ละคน
                        </p>
                    </CardContent>
                </Card>

                {/* Add Button */}
                <Button onClick={handleAdd} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มประเภทการลาใหม่
                </Button>

                {/* Leave Types List */}
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {leaveTypes.map((type) => (
                            <Card
                                key={type.id}
                                className={`border-none shadow-sm ${!type.isActive ? "opacity-50" : ""
                                    }`}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${type.color}`} />
                                            <div>
                                                <p className="font-semibold text-foreground">
                                                    {type.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    รหัส: {type.code}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={type.isActive}
                                                onCheckedChange={() => toggleActive(type.id)}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(type)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <p className="text-sm text-muted-foreground mb-3">
                                        {type.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {type.defaultDays === null
                                                ? "ไม่จำกัดวัน"
                                                : `${type.defaultDays} วัน/ปี`}
                                        </Badge>
                                        {type.maxPaidDays !== null && (
                                            <Badge variant="outline" className="text-xs">
                                                <DollarSign className="h-3 w-3 mr-1" />
                                                รับค่าจ้าง {type.maxPaidDays} วัน
                                            </Badge>
                                        )}
                                        {type.requiresDocument && (
                                            <Badge variant="outline" className="text-xs">
                                                <FileText className="h-3 w-3 mr-1" />
                                                ต้องมีเอกสาร
                                            </Badge>
                                        )}
                                        {type.requiresAdvanceNotice && (
                                            <Badge variant="outline" className="text-xs">
                                                <Clock className="h-3 w-3 mr-1" />
                                                แจ้งล่วงหน้า {type.advanceNoticeDays} วัน
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit/Add Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingType ? "แก้ไขประเภทการลา" : "เพิ่มประเภทการลา"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>ชื่อประเภทการลา *</Label>
                                <Input
                                    value={formData.name || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="เช่น ลาป่วย"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>รหัส *</Label>
                                <Input
                                    value={formData.code || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                                    }
                                    placeholder="เช่น SICK"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>คำอธิบาย</Label>
                            <Textarea
                                value={formData.description || ""}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                placeholder="รายละเอียดเงื่อนไขการลา"
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>จำนวนวันสิทธิ์/ปี</Label>
                                <Input
                                    type="number"
                                    value={formData.defaultDays ?? ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            defaultDays: e.target.value ? parseInt(e.target.value) : null,
                                        })
                                    }
                                    placeholder="ไม่จำกัด"
                                />
                                <p className="text-xs text-muted-foreground">
                                    ว่างไว้ = ไม่จำกัดวัน
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>วันที่รับค่าจ้างสูงสุด</Label>
                                <Input
                                    type="number"
                                    value={formData.maxPaidDays ?? ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            maxPaidDays: e.target.value ? parseInt(e.target.value) : null,
                                        })
                                    }
                                    placeholder="ไม่จำกัด"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>ต้องมีเอกสารประกอบ</Label>
                                    <p className="text-xs text-muted-foreground">
                                        เช่น ใบรับรองแพทย์
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.requiresDocument || false}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, requiresDocument: checked })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>ต้องแจ้งล่วงหน้า</Label>
                                    <p className="text-xs text-muted-foreground">
                                        กำหนดระยะเวลาแจ้งล่วงหน้า
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.requiresAdvanceNotice || false}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, requiresAdvanceNotice: checked })
                                    }
                                />
                            </div>

                            {formData.requiresAdvanceNotice && (
                                <div className="space-y-2">
                                    <Label>จำนวนวันที่ต้องแจ้งล่วงหน้า</Label>
                                    <Input
                                        type="number"
                                        value={formData.advanceNoticeDays || 0}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                advanceNoticeDays: parseInt(e.target.value) || 0,
                                            })
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>สีแสดงผล</Label>
                            <div className="flex flex-wrap gap-2">
                                {colorOptions.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`w-8 h-8 rounded-full ${color} ${formData.color === color
                                            ? "ring-2 ring-offset-2 ring-primary"
                                            : ""
                                            }`}
                                        onClick={() => setFormData({ ...formData, color })}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
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
