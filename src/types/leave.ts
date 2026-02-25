// Leave type definitions following Thai Labor Law
export interface LeaveType {
  id: string;
  code: string;
  name: string;
  description: string;
  defaultDays: number | null; // null = unlimited (e.g., sick leave actual days)
  maxPaidDays: number | null; // max days with pay per year
  requiresDocument: boolean;
  requiresAdvanceNotice: boolean;
  advanceNoticeDays: number;
  isActive: boolean;
  color: string;
}

// Default leave types based on Thai Labor Law
export const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  {
    id: "sick",
    code: "SICK",
    name: "ลาป่วย",
    description: "ลาเมื่อเจ็บป่วย (รับค่าจ้างไม่เกิน 30 วัน/ปี)",
    defaultDays: null, // unlimited actual sick days
    maxPaidDays: 30,
    requiresDocument: true, // ใบรับรองแพทย์เมื่อลา 3 วันขึ้นไป
    requiresAdvanceNotice: false,
    advanceNoticeDays: 0,
    isActive: true,
    color: "bg-red-500",
  },
  {
    id: "personal",
    code: "PERSONAL",
    name: "ลากิจ",
    description: "ลาเพื่อกิจธุระจำเป็น (ไม่น้อยกว่า 3 วัน/ปี)",
    defaultDays: 3,
    maxPaidDays: 3,
    requiresDocument: false,
    requiresAdvanceNotice: true,
    advanceNoticeDays: 1,
    isActive: true,
    color: "bg-blue-500",
  },
  {
    id: "vacation",
    code: "VACATION",
    name: "ลาพักร้อน",
    description: "ลาพักผ่อนประจำปี (ทำงานครบ 1 ปี ได้ไม่น้อยกว่า 6 วัน)",
    defaultDays: 6,
    maxPaidDays: 6,
    requiresDocument: false,
    requiresAdvanceNotice: true,
    advanceNoticeDays: 7,
    isActive: true,
    color: "bg-green-500",
  },
  {
    id: "maternity",
    code: "MATERNITY",
    name: "ลาคลอดบุตร",
    description: "ลาเพื่อคลอดบุตร (ไม่เกิน 98 วัน รับค่าจ้าง 45 วัน)",
    defaultDays: 98,
    maxPaidDays: 45,
    requiresDocument: true,
    requiresAdvanceNotice: true,
    advanceNoticeDays: 30,
    isActive: true,
    color: "bg-pink-500",
  },
  {
    id: "sterilization",
    code: "STERILIZATION",
    name: "ลาทำหมัน",
    description: "ลาเพื่อทำหมัน (ตามที่แพทย์กำหนด)",
    defaultDays: null,
    maxPaidDays: null,
    requiresDocument: true,
    requiresAdvanceNotice: true,
    advanceNoticeDays: 7,
    isActive: true,
    color: "bg-purple-500",
  },
  {
    id: "military",
    code: "MILITARY",
    name: "ลารับราชการทหาร",
    description: "ลาเพื่อรับราชการทหาร (รับค่าจ้างไม่เกิน 60 วัน)",
    defaultDays: null,
    maxPaidDays: 60,
    requiresDocument: true,
    requiresAdvanceNotice: true,
    advanceNoticeDays: 7,
    isActive: true,
    color: "bg-amber-600",
  },
  {
    id: "ordination",
    code: "ORDINATION",
    name: "ลาอุปสมบท",
    description: "ลาเพื่อบวช (ตามระเบียบบริษัท)",
    defaultDays: 15,
    maxPaidDays: 15,
    requiresDocument: true,
    requiresAdvanceNotice: true,
    advanceNoticeDays: 30,
    isActive: true,
    color: "bg-orange-500",
  },
  {
    id: "training",
    code: "TRAINING",
    name: "ลาฝึกอบรม",
    description: "ลาเพื่อฝึกอบรมหรือพัฒนาความรู้",
    defaultDays: 5,
    maxPaidDays: 5,
    requiresDocument: true,
    requiresAdvanceNotice: true,
    advanceNoticeDays: 7,
    isActive: true,
    color: "bg-cyan-500",
  },
];

// Employee leave entitlement - สิทธิ์การลาของพนักงานแต่ละคน
export interface EmployeeLeaveEntitlement {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  entitledDays: number; // จำนวนวันที่ได้รับสิทธิ์
  usedDays: number; // จำนวนวันที่ใช้ไปแล้ว
  pendingDays: number; // จำนวนวันที่รออนุมัติ
  carryOverDays: number; // วันที่ยกมาจากปีก่อน
}

// Leave request with validation
export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  documentUrl?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

// Helper function to calculate remaining days
export function getRemainingDays(entitlement: EmployeeLeaveEntitlement): number {
  return entitlement.entitledDays + entitlement.carryOverDays - entitlement.usedDays - entitlement.pendingDays;
}

// Helper function to check if employee can request leave
export function canRequestLeave(
  entitlement: EmployeeLeaveEntitlement | undefined,
  requestedDays: number,
  leaveType: LeaveType
): { canRequest: boolean; reason?: string } {
  // ถ้าไม่มี entitlement และเป็นประเภทที่ไม่จำกัดวัน (null) ให้ลาได้
  if (!entitlement) {
    if (leaveType.defaultDays === null) {
      return { canRequest: true };
    }
    return { canRequest: false, reason: "ไม่มีสิทธิ์การลาประเภทนี้" };
  }

  const remaining = getRemainingDays(entitlement);
  
  if (requestedDays > remaining) {
    return { 
      canRequest: false, 
      reason: `สิทธิ์การลาไม่เพียงพอ (เหลือ ${remaining} วัน, ขอ ${requestedDays} วัน)` 
    };
  }

  return { canRequest: true };
}
