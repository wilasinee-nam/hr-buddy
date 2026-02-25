"use client";

import { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, Users, Settings2 } from "lucide-react";
import { usePermission } from "@/contexts/PermissionContext";
import { ROLES, PERMISSIONS, Role, Permission } from "@/types/permissions";

export default function PermissionSettingsPage() {
    const {
        currentUser,
        setCurrentUser,
        rolePermissions,
        updateRolePermissions
    } = usePermission();

    const [selectedRole, setSelectedRole] = useState<Role>("employee");

    const handlePermissionToggle = (permission: Permission) => {
        const currentPerms = rolePermissions[selectedRole] || [];
        const newPerms = currentPerms.includes(permission)
            ? currentPerms.filter(p => p !== permission)
            : [...currentPerms, permission];
        updateRolePermissions(selectedRole, newPerms);
    };

    const handleRoleChange = (role: Role) => {
        setCurrentUser({ ...currentUser, role });
    };

    // Group permissions by module
    const groupedPermissions = PERMISSIONS.reduce((acc, perm) => {
        if (!acc[perm.module]) {
            acc[perm.module] = [];
        }
        acc[perm.module].push(perm);
        return acc;
    }, {} as Record<string, typeof PERMISSIONS>);

    const selectedRoleConfig = ROLES.find(r => r.id === selectedRole);

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-bold text-foreground">จัดการสิทธิ์การใช้งาน</h1>
            </div>

            <Tabs defaultValue="roles" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="roles" className="text-xs">
                        <Settings2 className="h-3 w-3 mr-1" />
                        กำหนดสิทธิ์ตาม Role
                    </TabsTrigger>
                    <TabsTrigger value="test" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        ทดสอบสิทธิ์
                    </TabsTrigger>
                </TabsList>

                {/* Role Permissions Tab */}
                <TabsContent value="roles" className="space-y-4">
                    {/* Role Selector */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">เลือก Role ที่ต้องการแก้ไข</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-2">
                                {ROLES.map((role) => (
                                    <button
                                        key={role.id}
                                        onClick={() => setSelectedRole(role.id)}
                                        className={`p-3 rounded-lg border text-left transition-all ${selectedRole === role.id
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-2 h-2 rounded-full ${role.color}`} />
                                            <span className="text-sm font-medium">{role.label}</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">{role.description}</p>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Permission List */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">
                                    สิทธิ์ของ {selectedRoleConfig?.label}
                                </CardTitle>
                                <Badge variant="outline" className="text-xs">
                                    {rolePermissions[selectedRole]?.length || 0} สิทธิ์
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {Object.entries(groupedPermissions).map(([module, perms]) => (
                                <div key={module}>
                                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                                        {module}
                                    </h4>
                                    <div className="space-y-2">
                                        {perms.map((perm) => (
                                            <div
                                                key={perm.id}
                                                className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg"
                                            >
                                                <Label htmlFor={perm.id} className="text-sm cursor-pointer">
                                                    {perm.label}
                                                </Label>
                                                <Switch
                                                    id={perm.id}
                                                    checked={rolePermissions[selectedRole]?.includes(perm.id) || false}
                                                    onCheckedChange={() => handlePermissionToggle(perm.id)}
                                                    disabled={selectedRole === "admin"} // Admin always has all
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <Separator className="mt-3" />
                                </div>
                            ))}

                            {selectedRole === "admin" && (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                    ผู้ดูแลระบบมีสิทธิ์ทั้งหมดโดยอัตโนมัติ
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Test Permissions Tab */}
                <TabsContent value="test" className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">ทดสอบสิทธิ์ผู้ใช้ปัจจุบัน</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs">เปลี่ยน Role เพื่อทดสอบ</Label>
                                <Select value={currentUser.role} onValueChange={(v: Role) => handleRoleChange(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLES.map((role) => (
                                            <SelectItem key={role.id} value={role.id}>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${role.color}`} />
                                                    {role.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-2">ผู้ใช้ปัจจุบัน:</p>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{currentUser.name}</span>
                                    <Badge className={ROLES.find(r => r.id === currentUser.role)?.color}>
                                        {ROLES.find(r => r.id === currentUser.role)?.label}
                                    </Badge>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground">สิทธิ์ที่มี:</p>
                                <div className="flex flex-wrap gap-1">
                                    {rolePermissions[currentUser.role]?.map((perm) => (
                                        <Badge key={perm} variant="secondary" className="text-[10px]">
                                            {PERMISSIONS.find(p => p.id === perm)?.label}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-4">
                            <p className="text-xs text-muted-foreground text-center">
                                💡 เปลี่ยน Role แล้วลองเข้าหน้าอื่นๆ เพื่อดูว่าปุ่มหรือเมนูไหนจะซ่อน/แสดง
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
