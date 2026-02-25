"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCircle, Building2, Phone, Mail, Briefcase, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const departments = ["ฝ่ายขาย", "คลังสินค้า", "ฝ่ายบุคคล", "ฝ่ายบัญชี", "ฝ่ายผลิต"];

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        nickname: "",
        phone: "",
        email: "",
        department: "",
        position: "",
        employeeId: "",
    });

    const handleChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const validateStep1 = () => {
        if (!formData.firstName || !formData.lastName) {
            toast.error("กรุณากรอกชื่อและนามสกุล");
            return false;
        }
        if (!formData.phone) {
            toast.error("กรุณากรอกเบอร์โทรศัพท์");
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.department) {
            toast.error("กรุณาเลือกแผนก");
            return false;
        }
        if (!formData.position) {
            toast.error("กรุณากรอกตำแหน่ง");
            return false;
        }
        return true;
    };

    const handleNextStep = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        } else if (step === 2 && validateStep2()) {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast.success("ลงทะเบียนสำเร็จ! ยินดีต้อนรับเข้าสู่ระบบ");
        setStep(3);

        // Navigate to home after showing success
        setTimeout(() => {
            router.push("/");
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
            {/* Header */}
            <div className="pt-8 pb-4 px-4 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-xl font-bold text-foreground">ลงทะเบียนพนักงาน</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    กรอกข้อมูลเพื่อเริ่มใช้งานระบบ
                </p>
            </div>

            {/* Progress Indicator */}
            <div className="px-6 mb-6">
                <div className="flex items-center justify-center gap-2">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                        {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : "1"}
                    </div>
                    <div className={`h-1 w-12 rounded transition-colors ${step >= 2 ? "bg-primary" : "bg-muted"
                        }`} />
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                        {step > 2 ? <CheckCircle2 className="h-5 w-5" /> : "2"}
                    </div>
                    <div className={`h-1 w-12 rounded transition-colors ${step >= 3 ? "bg-primary" : "bg-muted"
                        }`} />
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                        {step === 3 ? <CheckCircle2 className="h-5 w-5" /> : "3"}
                    </div>
                </div>
                <div className="flex justify-between mt-2 px-2">
                    <span className="text-[10px] text-muted-foreground">ข้อมูลส่วนตัว</span>
                    <span className="text-[10px] text-muted-foreground">ข้อมูลงาน</span>
                    <span className="text-[10px] text-muted-foreground">เสร็จสิ้น</span>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 px-4 pb-4">
                {step === 1 && (
                    <Card className="border-none shadow-lg">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <UserCircle className="h-5 w-5 text-primary" />
                                ข้อมูลส่วนตัว
                            </CardTitle>
                            <CardDescription className="text-xs">
                                กรอกข้อมูลพื้นฐานของคุณ
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-sm">ชื่อ <span className="text-destructive">*</span></Label>
                                    <Input
                                        placeholder="ชื่อจริง"
                                        value={formData.firstName}
                                        onChange={(e) => handleChange("firstName", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm">นามสกุล <span className="text-destructive">*</span></Label>
                                    <Input
                                        placeholder="นามสกุล"
                                        value={formData.lastName}
                                        onChange={(e) => handleChange("lastName", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm">ชื่อเล่น</Label>
                                <Input
                                    placeholder="ชื่อเล่น (ถ้ามี)"
                                    value={formData.nickname}
                                    onChange={(e) => handleChange("nickname", e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm flex items-center gap-1">
                                    <Phone className="h-3.5 w-3.5" />
                                    เบอร์โทรศัพท์ <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    type="tel"
                                    placeholder="0XX-XXX-XXXX"
                                    value={formData.phone}
                                    onChange={(e) => handleChange("phone", e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm flex items-center gap-1">
                                    <Mail className="h-3.5 w-3.5" />
                                    อีเมล
                                </Label>
                                <Input
                                    type="email"
                                    placeholder="email@example.com"
                                    value={formData.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {step === 2 && (
                    <Card className="border-none shadow-lg">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-primary" />
                                ข้อมูลการทำงาน
                            </CardTitle>
                            <CardDescription className="text-xs">
                                กรอกข้อมูลตำแหน่งงานของคุณ
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm">รหัสพนักงาน</Label>
                                <Input
                                    placeholder="เช่น EMP001 (ถ้ามี)"
                                    value={formData.employeeId}
                                    onChange={(e) => handleChange("employeeId", e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm">แผนก <span className="text-destructive">*</span></Label>
                                <Select
                                    value={formData.department}
                                    onValueChange={(value) => handleChange("department", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกแผนก" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm">ตำแหน่ง <span className="text-destructive">*</span></Label>
                                <Input
                                    placeholder="เช่น พนักงานขาย, ผู้จัดการ"
                                    value={formData.position}
                                    onChange={(e) => handleChange("position", e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {step === 3 && (
                    <Card className="border-none shadow-lg">
                        <CardContent className="pt-8 pb-8 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-4">
                                <CheckCircle2 className="h-10 w-10 text-success" />
                            </div>
                            <h2 className="text-lg font-bold text-foreground mb-2">
                                ลงทะเบียนสำเร็จ!
                            </h2>
                            <p className="text-sm text-muted-foreground mb-4">
                                ยินดีต้อนรับ คุณ{formData.firstName} {formData.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                กำลังพาคุณไปยังหน้าหลัก...
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Bottom Actions */}
            {step < 3 && (
                <div className="p-4 bg-background border-t border-border">
                    <div className="flex gap-3">
                        {step > 1 && (
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setStep(step - 1)}
                            >
                                ย้อนกลับ
                            </Button>
                        )}
                        <Button
                            className="flex-1"
                            onClick={handleNextStep}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                "กำลังบันทึก..."
                            ) : step === 2 ? (
                                "ยืนยันข้อมูล"
                            ) : (
                                "ถัดไป"
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
