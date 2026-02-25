"use client";

import { useState, useMemo, useRef, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, AlertCircle, CheckCircle, Calendar, FileText, Paperclip, X, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { getLeaveTypes } from "@/actions/leave-types";
import { getEntitlements, submitLeaveRequest } from "@/actions/leave-requests";
import { LeaveType, LeaveEntitlement } from "@prisma/client";

export default function LeaveRequestPage() {
    const router = useRouter();
    const user = useStore((state) => state.user);
    const organization = useStore((state) => state.organization);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [entitlements, setEntitlements] = useState<(LeaveEntitlement & { leaveType: LeaveType })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        type: "",
        startDate: "",
        endDate: "",
        reason: "",
    });

    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (user && organization) {
                try {
                    const [types, userEntitlements] = await Promise.all([
                        getLeaveTypes(organization.id),
                        getEntitlements(user.id, new Date().getFullYear())
                    ]);
                    setLeaveTypes(types.filter(t => t.isActive));
                    setEntitlements(userEntitlements);
                } catch (error) {
                    console.error("Error fetching data:", error);
                    toast.error("Failed to load leave data");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
    }, [user, organization]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setAttachedFiles(prev => [...prev, ...newFiles]);
        }
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    // Calculate days between dates
    const calculateDays = (start: string, end: string): number => {
        if (!start || !end) return 0;
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = endDate.getTime() - startDate.getTime();
        // Add 1 day because leave includes both start and end dates
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays > 0 ? diffDays : 0;
    };

    const requestedDays = useMemo(() =>
        calculateDays(formData.startDate, formData.endDate),
        [formData.startDate, formData.endDate]
    );

    const selectedLeaveType = useMemo(() =>
        leaveTypes.find(t => t.id.toString() === formData.type),
        [formData.type, leaveTypes]
    );

    const entitlement = useMemo(() =>
        entitlements.find(e => e.leaveTypeId.toString() === formData.type),
        [formData.type, entitlements]
    );

    const remainingDays = useMemo(() => {
        if (!entitlement) return null;
        return entitlement.entitledDays + entitlement.carryOverDays - entitlement.usedDays - entitlement.pendingDays;
    }, [entitlement]);

    const validation = useMemo(() => {
        if (!selectedLeaveType || requestedDays === 0) {
            return { canRequest: true, reason: undefined };
        }

        if (!entitlement) {
            // If no entitlement record but type exists, check if it's unlimited (null defaultDays)
            // or if we should block.
            if (selectedLeaveType.defaultDays === null) {
                return { canRequest: true, reason: undefined };
            }
            return { canRequest: false, reason: "ไม่พบข้อมูลสิทธิ์การลาประเภทนี้" };
        }

        if (remainingDays !== null && requestedDays > remainingDays) {
            return { canRequest: false, reason: `วันลาคงเหลือไม่เพียงพอ (เหลือ ${remainingDays} วัน)` };
        }

        return { canRequest: true, reason: undefined };
    }, [entitlement, requestedDays, selectedLeaveType, remainingDays]);

    // Check advance notice requirement
    const advanceNoticeWarning = useMemo(() => {
        if (!selectedLeaveType?.requiresAdvanceNotice || !formData.startDate) {
            return null;
        }
        const today = new Date();
        const startDate = new Date(formData.startDate);
        const diffDays = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < selectedLeaveType.advanceNoticeDays) {
            return `การลาประเภทนี้ต้องแจ้งล่วงหน้าอย่างน้อย ${selectedLeaveType.advanceNoticeDays} วัน`;
        }
        return null;
    }, [selectedLeaveType, formData.startDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error("User not found");
            return;
        }

        if (!formData.type || !formData.startDate || !formData.endDate) {
            toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        if (!validation.canRequest) {
            toast.error(validation.reason || "ไม่สามารถส่งคำขอลาได้");
            return;
        }

        setIsSubmitting(true);
        try {
            // TODO: Handle file upload (mock for now or implement storage)
            const documentUrl = attachedFiles.length > 0 ? "mock-url-managed-later" : undefined;

            const result = await submitLeaveRequest({
                userId: user.id,
                leaveTypeId: parseInt(formData.type),
                startDate: formData.startDate,
                endDate: formData.endDate,
                reason: formData.reason,
                documentUrl
            });

            if (result.success) {
                toast.success("ส่งคำขอลางานเรียบร้อยแล้ว");
                router.push("/leave");
            } else {
                toast.error(result.error || "เกิดข้อผิดพลาดในการส่งคำขอ");
            }
        } catch (error) {
            console.error(error);
            toast.error("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="p-4 flex justify-center">Loading...</div>;
    }

    return (
        <>
            <div className="bg-primary text-primary-foreground p-4">
                <div className="flex items-center gap-3">
                    <Link href="/leave">
                        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-lg font-semibold">ขอลางาน</h1>
                </div>
            </div>

            <div className="p-4 space-y-4">
                <Card className="border-none shadow-sm">
                    <CardContent className="p-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Leave Type Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="type">ประเภทการลา</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกประเภทการลา" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {leaveTypes.map((type) => {
                                            const ent = entitlements.find(e => e.leaveTypeId === type.id);
                                            const remaining = ent
                                                ? (ent.entitledDays + ent.carryOverDays - ent.usedDays - ent.pendingDays)
                                                : type.defaultDays === null ? "ไม่จำกัด" : 0;

                                            return (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${type.color || 'bg-gray-400'}`} />
                                                        <span>{type.name}</span>
                                                        {remaining !== null && (
                                                            <Badge variant="secondary" className="text-xs ml-2">
                                                                เหลือ {remaining} วัน
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Leave Type Info */}
                            {selectedLeaveType && (
                                <Card className="bg-muted/50 border-none">
                                    <CardContent className="p-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${selectedLeaveType.color || 'bg-gray-400'}`} />
                                            <span className="font-semibold text-sm">{selectedLeaveType.name}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {selectedLeaveType.description}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {remainingDays !== null && (
                                                <Badge variant="outline" className="text-xs">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    คงเหลือ {remainingDays} วัน
                                                </Badge>
                                            )}
                                            {selectedLeaveType.requiresDocument && (
                                                <Badge variant="outline" className="text-xs">
                                                    <FileText className="h-3 w-3 mr-1" />
                                                    ต้องมีเอกสาร
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Date Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">วันที่เริ่มลา</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">วันที่สิ้นสุด</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={formData.endDate}
                                        min={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Days Count */}
                            {requestedDays > 0 && (
                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span className="text-sm text-muted-foreground">จำนวนวันที่ขอลา</span>
                                    <Badge variant="secondary" className="text-lg px-3 py-1">
                                        {requestedDays} วัน
                                    </Badge>
                                </div>
                            )}

                            {/* Validation Warnings */}
                            {!validation.canRequest && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{validation.reason}</AlertDescription>
                                </Alert>
                            )}

                            {advanceNoticeWarning && (
                                <Alert className="bg-orange-100 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-900 dark:text-orange-400">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{advanceNoticeWarning}</AlertDescription>
                                </Alert>
                            )}

                            {validation.canRequest && requestedDays > 0 && selectedLeaveType && (
                                <Alert className="bg-green-100 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900 dark:text-green-400">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>สามารถลาได้ สิทธิ์เพียงพอ</AlertDescription>
                                </Alert>
                            )}

                            {/* Reason */}
                            <div className="space-y-2">
                                <Label htmlFor="reason">เหตุผล</Label>
                                <Textarea
                                    id="reason"
                                    placeholder="ระบุเหตุผลในการลา..."
                                    rows={4}
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </div>

                            {/* Document Attachment */}
                            <div className="space-y-2">
                                <Label>แนบเอกสาร (ไม่บังคับ)</Label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-12 border-dashed"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    เลือกไฟล์แนบ
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    รองรับไฟล์ PDF, DOC, DOCX, JPG, PNG
                                </p>

                                {/* Attached Files List */}
                                {attachedFiles.length > 0 && (
                                    <div className="space-y-2 mt-3">
                                        {attachedFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-2 bg-muted rounded-lg"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 flex-shrink-0"
                                                    onClick={() => removeFile(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Document Upload Notice */}
                            {selectedLeaveType?.requiresDocument && (
                                <Alert className="bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-900 dark:text-blue-400">
                                    <FileText className="h-4 w-4" />
                                    <AlertDescription>
                                        การลาประเภทนี้ต้องมีเอกสารประกอบ (เช่น ใบรับรองแพทย์)
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-semibold"
                                disabled={!validation.canRequest || isSubmitting}
                            >
                                {isSubmitting ? "กำลังส่งข้อมูล..." : "ส่งคำขอลา"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>

    );
}
