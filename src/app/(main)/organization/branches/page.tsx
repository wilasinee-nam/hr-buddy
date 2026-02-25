"use client";

import { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    MapPin,
    Plus,
    Pencil,
    Trash2,
    Building2,
    Navigation
} from "lucide-react";
import { toast } from "sonner";

import { Branch, initialBranches } from "@/data/mock-branches";


export default function BranchesPage() {
    const [branches, setBranches] = useState<Branch[]>(initialBranches);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        lat: "",
        lon: "",
        radius: "200",
    });

    const resetForm = () => {
        setFormData({ name: "", address: "", lat: "", lon: "", radius: "200" });
    };

    const handleAdd = () => {
        if (!formData.name.trim() || !formData.lat || !formData.lon) {
            toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        const newBranch: Branch = {
            id: Date.now().toString(),
            name: formData.name,
            address: formData.address,
            lat: parseFloat(formData.lat),
            lon: parseFloat(formData.lon),
            radius: parseInt(formData.radius) || 200,
        };
        setBranches([...branches, newBranch]);
        resetForm();
        setIsAddOpen(false);
        toast.success("เพิ่มสาขาใหม่เรียบร้อยแล้ว");
    };

    const handleEdit = () => {
        if (!selectedBranch) return;
        if (!formData.name.trim() || !formData.lat || !formData.lon) {
            toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        setBranches(branches.map(b =>
            b.id === selectedBranch.id
                ? {
                    ...b,
                    name: formData.name,
                    address: formData.address,
                    lat: parseFloat(formData.lat),
                    lon: parseFloat(formData.lon),
                    radius: parseInt(formData.radius) || 200,
                }
                : b
        ));
        resetForm();
        setIsEditOpen(false);
        setSelectedBranch(null);
        toast.success("แก้ไขข้อมูลสาขาเรียบร้อยแล้ว");
    };

    const handleDelete = (branchId: string) => {
        setBranches(branches.filter(b => b.id !== branchId));
        toast.success("ลบสาขาเรียบร้อยแล้ว");
    };

    const openEditDialog = (branch: Branch) => {
        setSelectedBranch(branch);
        setFormData({
            name: branch.name,
            address: branch.address,
            lat: branch.lat.toString(),
            lon: branch.lon.toString(),
            radius: branch.radius.toString(),
        });
        setIsEditOpen(true);
    };

    const BranchForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>ชื่อสาขา *</Label>
                <Input
                    placeholder="เช่น สำนักงานใหญ่ (กรุงเทพฯ)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
            </div>
            <div className="space-y-2">
                <Label>ที่อยู่</Label>
                <Input
                    placeholder="ที่อยู่เต็ม"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label>Latitude *</Label>
                    <Input
                        type="number"
                        step="any"
                        placeholder="13.756331"
                        value={formData.lat}
                        onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Longitude *</Label>
                    <Input
                        type="number"
                        step="any"
                        placeholder="100.501762"
                        value={formData.lon}
                        onChange={(e) => setFormData({ ...formData, lon: e.target.value })}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label>รัศมีเช็คอิน (เมตร)</Label>
                <Input
                    type="number"
                    placeholder="200"
                    value={formData.radius}
                    onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                    ระยะห่างสูงสุดที่อนุญาตให้เช็คอินได้ (ค่าเริ่มต้น 200 เมตร)
                </p>
            </div>
            <Button onClick={onSubmit} className="w-full">
                {submitLabel}
            </Button>
        </div>
    );

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h1 className="text-lg font-bold text-foreground">จัดการสาขา</h1>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={resetForm}>
                            <Plus className="h-4 w-4 mr-1" />
                            เพิ่มสาขา
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>เพิ่มสาขาใหม่</DialogTitle>
                        </DialogHeader>
                        <BranchForm onSubmit={handleAdd} submitLabel="เพิ่มสาขา" />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary */}
            <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                    ทั้งหมด {branches.length} สาขา
                </Badge>
            </div>

            {/* Branch List */}
            <div className="space-y-3">
                {branches.map((branch) => (
                    <Card key={branch.id} className="border-none shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <MapPin className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-foreground">
                                            {branch.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {branch.address}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex items-center gap-1">
                                                <Navigation className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-[10px] text-muted-foreground">
                                                    {branch.lat.toFixed(4)}, {branch.lon.toFixed(4)}
                                                </span>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] px-1.5">
                                                รัศมี {branch.radius} ม.
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => openEditDialog(branch)}
                                    >
                                        <Pencil className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleDelete(branch.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
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
                        <DialogTitle>แก้ไขข้อมูลสาขา</DialogTitle>
                    </DialogHeader>
                    <BranchForm onSubmit={handleEdit} submitLabel="บันทึกการแก้ไข" />
                </DialogContent>
            </Dialog>

            {branches.length === 0 && (
                <div className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">ยังไม่มีสาขา</p>
                    <p className="text-xs text-muted-foreground">กดปุ่ม "เพิ่มสาขา" เพื่อเริ่มต้น</p>
                </div>
            )}

            {/* Info Card */}
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground text-center">
                        💡 พิกัด Lat/Lon สามารถหาได้จาก Google Maps โดยคลิกขวาที่ตำแหน่งและเลือก "พิกัดที่นี่"
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

