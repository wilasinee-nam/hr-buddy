// Role types
export type Role = "admin" | "hr" | "manager" | "employee";

// Permission types for each module
export type Permission = 
  | "employees.view"
  | "employees.create"
  | "employees.edit"
  | "employees.delete"
  | "branches.view"
  | "branches.manage"
  | "schedules.view"
  | "schedules.manage"
  | "reports.view"
  | "attendance.view_all"
  | "leave.approve";

// Role configuration with Thai labels
export interface RoleConfig {
  id: Role;
  label: string;
  description: string;
  color: string;
}

export const ROLES: RoleConfig[] = [
  { id: "admin", label: "ผู้ดูแลระบบ", description: "สิทธิ์เต็มทุกฟังก์ชัน", color: "bg-destructive" },
  { id: "hr", label: "HR", description: "จัดการพนักงาน ลางาน ประวัติ", color: "bg-primary" },
  { id: "manager", label: "หัวหน้างาน", description: "ดูรายงาน อนุมัติลา", color: "bg-blue-500" },
  { id: "employee", label: "พนักงานทั่วไป", description: "ใช้งานพื้นฐาน", color: "bg-muted-foreground" },
];

// Permission configuration with Thai labels
export interface PermissionConfig {
  id: Permission;
  label: string;
  module: string;
}

export const PERMISSIONS: PermissionConfig[] = [
  // Employees
  { id: "employees.view", label: "ดูรายชื่อพนักงาน", module: "พนักงาน" },
  { id: "employees.create", label: "เพิ่มพนักงาน", module: "พนักงาน" },
  { id: "employees.edit", label: "แก้ไขข้อมูลพนักงาน", module: "พนักงาน" },
  { id: "employees.delete", label: "ลบพนักงาน", module: "พนักงาน" },
  // Branches
  { id: "branches.view", label: "ดูสาขา", module: "สาขา" },
  { id: "branches.manage", label: "จัดการสาขา", module: "สาขา" },
  // Schedules
  { id: "schedules.view", label: "ดูกะการทำงาน", module: "กะการทำงาน" },
  { id: "schedules.manage", label: "จัดการกะการทำงาน", module: "กะการทำงาน" },
  // Reports
  { id: "reports.view", label: "ดูรายงาน/ประวัติ", module: "รายงาน" },
  { id: "attendance.view_all", label: "ดูการเข้างานทุกคน", module: "รายงาน" },
  { id: "leave.approve", label: "อนุมัติใบลา", module: "รายงาน" },
];

// Default permissions for each role
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: PERMISSIONS.map(p => p.id), // All permissions
  hr: [
    "employees.view", "employees.create", "employees.edit", "employees.delete",
    "branches.view", "branches.manage",
    "schedules.view", "schedules.manage",
    "reports.view", "attendance.view_all", "leave.approve",
  ],
  manager: [
    "employees.view",
    "branches.view",
    "schedules.view",
    "reports.view", "attendance.view_all", "leave.approve",
  ],
  employee: [
    "branches.view",
    "schedules.view",
  ],
};
