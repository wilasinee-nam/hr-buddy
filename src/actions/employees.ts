"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getEmployees(organizationId: number) {
    try {
        const employees = await prisma.user.findMany({
            where: {
                organizationId,
                status: "active",
            },
            select: {
                id: true,
                name: true,
                employeeId: true,
                position: true,
                department: true,
                departmentId: true,
                departmentRel: { select: { id: true, name: true } },
                branchId: true,
                branchRel: { select: { id: true, name: true } },
                positionId: true,
                positionRel: { select: { id: true, name: true } },
                phoneNumber: true,
                email: true,
                status: true,
                startDate: true,
                pictureUrl: true,
                vacationDays: true,
                workSchedules: {
                    select: { id: true, name: true, startTime: true, endTime: true },
                },
            },
            orderBy: { name: "asc" },
        });

        return { success: true, data: employees };
    } catch (error: any) {
        console.error("Error fetching employees:", error);
        return { success: false, error: error.message };
    }
}

export async function getTodayCheckinCount(organizationId: number) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const checkins = await prisma.attendance.findMany({
            where: {
                type: "IN",
                timestamp: {
                    gte: today,
                    lt: tomorrow,
                },
                user: {
                    organizationId,
                    status: "active",
                },
            },
            select: {
                userId: true,
            },
            distinct: ["userId"],
        });

        return { success: true, count: checkins.length };
    } catch (error: any) {
        console.error("Error fetching today checkin count:", error);
        return { success: false, count: 0 };
    }
}

export async function getEmployeeFormData(organizationId: number) {
    try {
        const [departments, branches, positions, schedules] = await Promise.all([
            prisma.department.findMany({
                where: { organizationId },
                select: { id: true, name: true },
                orderBy: { name: "asc" },
            }),
            prisma.branch.findMany({
                where: { organizationId },
                select: { id: true, name: true },
                orderBy: { name: "asc" },
            }),
            prisma.position.findMany({
                where: { organizationId },
                select: { id: true, name: true },
                orderBy: { name: "asc" },
            }),
            prisma.workSchedule.findMany({
                where: { organizationId },
                select: { id: true, name: true, startTime: true, endTime: true },
                orderBy: { name: "asc" },
            }),
        ]);

        return { success: true, data: { departments, branches, positions, schedules } };
    } catch (error: any) {
        console.error("Error fetching form data:", error);
        return { success: false, error: error.message };
    }
}

interface CreateEmployeeData {
    name: string;
    employeeId?: string;
    positionId?: number;
    departmentId?: number;
    branchId?: number;
    scheduleId?: number;
    phoneNumber?: string;
    email?: string;
    vacationDays?: number;
}

export async function createEmployee(organizationId: number, data: CreateEmployeeData) {
    try {
        const user = await prisma.user.create({
            data: {
                organizationId,
                name: data.name,
                employeeId: data.employeeId || null,
                positionId: data.positionId || null,
                departmentId: data.departmentId || null,
                branchId: data.branchId || null,
                phoneNumber: data.phoneNumber || null,
                email: data.email || null,
                vacationDays: data.vacationDays ?? 0,
                status: "active",
                startDate: new Date(),
                ...(data.scheduleId
                    ? { workSchedules: { connect: { id: data.scheduleId } } }
                    : {}),
            },
        });

        revalidatePath("/employees");
        return { success: true, data: user };
    } catch (error: any) {
        console.error("Error creating employee:", error);
        return { success: false, error: error.message };
    }
}

interface UpdateEmployeeData {
    name?: string;
    employeeId?: string | null;
    positionId?: number | null;
    departmentId?: number | null;
    branchId?: number | null;
    scheduleId?: number | null;
    phoneNumber?: string;
    email?: string;
    vacationDays?: number;
}

export async function updateEmployee(employeeId: number, data: UpdateEmployeeData) {
    try {
        // Build workSchedules update: disconnect all then connect new one
        const scheduleUpdate = data.scheduleId !== undefined
            ? {
                workSchedules: {
                    set: data.scheduleId ? [{ id: data.scheduleId }] : [],
                },
            }
            : {};

        await prisma.user.update({
            where: { id: employeeId },
            data: {
                name: data.name,
                employeeId: data.employeeId,
                positionId: data.positionId,
                departmentId: data.departmentId,
                branchId: data.branchId,
                phoneNumber: data.phoneNumber,
                email: data.email,
                vacationDays: data.vacationDays,
                ...scheduleUpdate,
            },
        });

        revalidatePath("/employees");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating employee:", error);
        return { success: false, error: error.message };
    }
}
