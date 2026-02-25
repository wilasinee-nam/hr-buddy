"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface WorkScheduleData {
    name: string;
    startTime: string;
    endTime: string;
    lunchStart?: string;
    lunchEnd?: string;
    workDays: number[];
    isDefault?: boolean;
}

export async function getWorkSchedules(organizationId: number) {
    try {
        const schedules = await prisma.workSchedule.findMany({
            where: { organizationId },
            orderBy: { createdAt: "asc" },
        });
        return schedules;
    } catch (error) {
        console.error("Error fetching work schedules:", error);
        return [];
    }
}

export async function createWorkSchedule(
    organizationId: number,
    data: WorkScheduleData
) {
    try {
        // If this is the first schedule, make it default automatically
        const count = await prisma.workSchedule.count({
            where: { organizationId },
        });
        const isDefault = count === 0 ? true : data.isDefault || false;

        await prisma.workSchedule.create({
            data: {
                organizationId,
                name: data.name,
                startTime: data.startTime,
                endTime: data.endTime,
                lunchStart: data.lunchStart,
                lunchEnd: data.lunchEnd,
                workDays: data.workDays,
                isDefault,
            },
        });

        revalidatePath("/organization/schedules");
        return { success: true };
    } catch (error: any) {
        console.error("Error creating work schedule:", error);
        return { success: false, error: error.message };
    }
}

export async function updateWorkSchedule(
    scheduleId: number,
    data: WorkScheduleData
) {
    try {
        await prisma.workSchedule.update({
            where: { id: scheduleId },
            data: {
                name: data.name,
                startTime: data.startTime,
                endTime: data.endTime,
                lunchStart: data.lunchStart,
                lunchEnd: data.lunchEnd,
                workDays: data.workDays,
            },
        });

        revalidatePath("/organization/schedules");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating work schedule:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteWorkSchedule(scheduleId: number) {
    try {
        const schedule = await prisma.workSchedule.findUnique({
            where: { id: scheduleId },
            include: { _count: { select: { users: true } } },
        });

        if (!schedule) {
            throw new Error("Schedule not found");
        }

        if (schedule.isDefault) {
            throw new Error("Cannot delete default schedule");
        }

        if (schedule._count.users > 0) {
            throw new Error(`Cannot delete schedule used by ${schedule._count.users} users`);
        }

        await prisma.workSchedule.delete({
            where: { id: scheduleId },
        });

        revalidatePath("/organization/schedules");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting work schedule:", error);
        return { success: false, error: error.message };
    }
}

export async function setWorkScheduleDefault(
    organizationId: number,
    scheduleId: number
) {
    try {
        await prisma.$transaction([
            // Unset previous default
            prisma.workSchedule.updateMany({
                where: { organizationId, isDefault: true },
                data: { isDefault: false },
            }),
            // Set new default
            prisma.workSchedule.update({
                where: { id: scheduleId },
                data: { isDefault: true },
            }),
        ]);

        revalidatePath("/organization/schedules");
        return { success: true };
    } catch (error: any) {
        console.error("Error setting default work schedule:", error);
        return { success: false, error: error.message };
    }
}
