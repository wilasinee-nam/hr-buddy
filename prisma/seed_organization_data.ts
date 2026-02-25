
import prisma from '../src/lib/prisma'
import { PERMISSIONS, ROLES } from '../src/types/permissions'

const defaultDepartments = [
    { name: 'ฝ่ายบริหาร', description: 'Management', color: '#EF4444' },
    { name: 'ฝ่ายบุคคล', description: 'Human Resources', color: '#F97316' },
    { name: 'ฝ่ายบัญชีและการเงิน', description: 'Accounting & Finance', color: '#F59E0B' },
    { name: 'ฝ่ายขายและการตลาด', description: 'Sales & Marketing', color: '#10B981' },
    { name: 'ฝ่ายไอที', description: 'Information Technology', color: '#3B82F6' },
    { name: 'ฝ่ายปฏิบัติการ', description: 'Operations', color: '#6366F1' },
]

const defaultPositions = [
    { name: 'กรรมการผู้จัดการ', description: 'Managing Director', color: '#EF4444' },
    { name: 'ผู้จัดการทั่วไป', description: 'General Manager', color: '#F97316' },
    { name: 'ผู้จัดการฝ่าย', description: 'Department Manager', color: '#F59E0B' },
    { name: 'หัวหน้าแผนก', description: 'Supervisor', color: '#10B981' },
    { name: 'พนักงานอาวุโส', description: 'Senior Staff', color: '#3B82F6' },
    { name: 'พนักงาน', description: 'Staff', color: '#6366F1' },
]

const defaultSchedules = [
    {
        name: "กะปกติ (Office)",
        startTime: "08:30",
        endTime: "17:30",
        lunchStart: "12:00",
        lunchEnd: "13:00",
        workDays: [1, 2, 3, 4, 5],
        isDefault: true
    },
    {
        name: "กะเช้า (คลังสินค้า)",
        startTime: "06:00",
        endTime: "14:00",
        lunchStart: "10:00",
        lunchEnd: "10:30",
        workDays: [1, 2, 3, 4, 5, 6],
        isDefault: false
    }
]

// Default permissions are already defined in src/types/permissions.ts
// We will use DEFAULT_ROLE_PERMISSIONS from there if we could import it, 
// but since this script runs in a different context, let's redefine or import carefully.
// To avoid complex imports in seed script, I'll hardcode the essential structure based on the type definition.

const defaultRolePermissions = {
    admin: PERMISSIONS.map(p => p.id),
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
}

async function main() {
    console.log('Seeding organization data...')

    const organizations = await prisma.organization.findMany()

    for (const org of organizations) {
        console.log(`Processing Organization: ${org.name} (${org.id})`)

        // Seed Departments
        for (const dept of defaultDepartments) {
            await prisma.department.upsert({
                where: { id: -1 }, // Hack: we don't have a unique key other than ID, so we use findFirst check usually. For seed, let's just create if not exists or use create.
                create: { ...dept, organizationId: org.id },
                update: {}, // No update
            }).catch(async () => {
                // Fallback if upsert with invalid ID fails, try findFirst
                const existing = await prisma.department.findFirst({
                    where: { organizationId: org.id, name: dept.name }
                })
                if (!existing) {
                    await prisma.department.create({
                        data: { ...dept, organizationId: org.id }
                    })
                }
            })
        }
        console.log(`- Seeded Departments`)

        // Seed Positions
        for (const pos of defaultPositions) {
            const existing = await prisma.position.findFirst({
                where: { organizationId: org.id, name: pos.name }
            })
            if (!existing) {
                await prisma.position.create({
                    data: { ...pos, organizationId: org.id }
                })
            }
        }
        console.log(`- Seeded Positions`)

        // Seed Work Schedules
        for (const schedule of defaultSchedules) {
            const existing = await prisma.workSchedule.findFirst({
                where: { organizationId: org.id, name: schedule.name }
            })
            if (!existing) {
                await prisma.workSchedule.create({
                    data: {
                        organizationId: org.id,
                        name: schedule.name,
                        startTime: schedule.startTime,
                        endTime: schedule.endTime,
                        lunchStart: schedule.lunchStart,
                        lunchEnd: schedule.lunchEnd,
                        workDays: schedule.workDays,
                        isDefault: schedule.isDefault
                    }
                })
            }
        }
        console.log(`- Seeded Work Schedules`)

        // Seed Role Permissions
        for (const [role, perms] of Object.entries(defaultRolePermissions)) {
            await prisma.rolePermission.upsert({
                where: {
                    organizationId_role: {
                        organizationId: org.id,
                        role: role
                    }
                },
                update: {
                    permissions: perms
                },
                create: {
                    organizationId: org.id,
                    role: role,
                    permissions: perms
                }
            })
        }
        console.log(`- Seeded Role Permissions`)

        // Seed Department Approvers
        // Find a user to be the approver (e.g., the first user created or Admin)
        const approverUser = await prisma.user.findFirst({
            where: { organizationId: org.id }
        })

        if (approverUser) {
            const departments = await prisma.department.findMany({
                where: { organizationId: org.id }
            })

            for (const dept of departments) {
                // Check if approver already exists
                const existingApprover = await prisma.departmentApprover.findFirst({
                    where: { departmentId: dept.id, order: 1 }
                })

                if (!existingApprover) {
                    await prisma.departmentApprover.create({
                        data: {
                            departmentId: dept.id,
                            approverId: approverUser.id,
                            order: 1
                        }
                    })
                }
            }
            console.log(`- Seeded Department Approvers`)
        } else {
            console.log(`- Skipped Department Approvers (No user found)`)
        }

        // Seed User Work Schedules
        const officeSchedule = await prisma.workSchedule.findFirst({
            where: { organizationId: org.id, name: 'กะปกติ (Office)' }
        })

        if (officeSchedule) {
            const users = await prisma.user.findMany({
                where: { organizationId: org.id },
                include: { workSchedules: true }
            })

            for (const user of users) {
                const hasSchedule = user.workSchedules.some(s => s.id === officeSchedule.id)
                if (!hasSchedule) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            workSchedules: {
                                connect: { id: officeSchedule.id }
                            }
                        }
                    })
                }
            }
            console.log(`- Seeded User Work Schedules`)
        }

        // Seed Leave Types
        const defaultLeaveTypes = [
            {
                code: "SICK",
                name: "ลาป่วย",
                description: "ลาเมื่อเจ็บป่วย (รับค่าจ้างไม่เกิน 30 วัน/ปี)",
                defaultDays: null,
                maxPaidDays: 30,
                requiresDocument: true,
                requiresAdvanceNotice: false,
                advanceNoticeDays: 0,
                isActive: true,
                color: "bg-red-500",
            },
            {
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

        for (const type of defaultLeaveTypes) {
            await prisma.leaveType.upsert({
                where: {
                    organizationId_code: {
                        organizationId: org.id,
                        code: type.code
                    }
                },
                update: {}, // Don't update if exists
                create: {
                    organizationId: org.id,
                    ...type
                }
            })
            console.log(`Created/Updated leave type: ${type.name} for ${org.name}`);
        }
        // console.log(`- Seeded Leave Types`) // This line is replaced by the per-type log

        // Seed Leave Entitlements for all users in the organization
        // This ensures every user has a starting balance for each leave type
        const users = await prisma.user.findMany({
            where: { organizationId: org.id },
        });

        const leaveTypes = await prisma.leaveType.findMany({
            where: { organizationId: org.id },
        });

        const currentYear = new Date().getFullYear();

        for (const user of users) {
            for (const type of leaveTypes) {
                // Default entitlement logic (customize as needed)
                // For unlimited leave types (null defaultDays), we might set a high number or handle it in logic
                // Here we just use defaultDays or 0 if null for the entitlement record
                let entitledDays = type.defaultDays ?? 0;

                // Special case for SICK leave which is usually 30 paid days but unlimited actual days
                if (type.code === 'SICK') {
                    entitledDays = 30; // Paid sick days
                }

                await prisma.leaveEntitlement.upsert({
                    where: {
                        userId_leaveTypeId_year: {
                            userId: user.id,
                            leaveTypeId: type.id,
                            year: currentYear,
                        },
                    },
                    update: {
                        entitledDays: entitledDays,
                    },
                    create: {
                        userId: user.id,
                        leaveTypeId: type.id,
                        year: currentYear,
                        entitledDays: entitledDays,
                        usedDays: 0,
                        pendingDays: 0,
                        carryOverDays: 0,
                    },
                });
            }
            console.log(`Seeded entitlements for user: ${user.name}`);
        }
        console.log("Seeding completed.");
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
