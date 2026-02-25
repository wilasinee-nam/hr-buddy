"use server";

import prisma from "@/lib/prisma";
import { LeaveType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getLeaveTypes(organizationId: number) {
    try {
        const leaveTypes = await prisma.leaveType.findMany({
            where: { organizationId },
            orderBy: { id: "asc" },
        });
        return leaveTypes;
    } catch (error) {
        console.error("Error fetching leave types:", error);
        return [];
    }
}

export async function createLeaveType(organizationId: number, data: Omit<LeaveType, "id" | "organizationId" | "createdAt" | "updatedAt">) {
    try {
        const leaveType = await prisma.leaveType.create({
            data: {
                organizationId,
                ...data,
            },
        });
        revalidatePath("/leave/settings");
        return { success: true, data: leaveType };
    } catch (error) {
        console.error("Error creating leave type:", error);
        return { success: false, error: "Failed to create leave type" };
    }
}

export async function updateLeaveType(id: number, organizationId: number, data: Partial<LeaveType>) {
    try {
        // Verify ownership
        const existing = await prisma.leaveType.findFirst({
            where: { id, organizationId },
        });

        if (!existing) {
            return { success: false, error: "Leave type not found" };
        }

        const leaveType = await prisma.leaveType.update({
            where: { id },
            data,
        });
        revalidatePath("/leave/settings");
        return { success: true, data: leaveType };
    } catch (error) {
        console.error("Error updating leave type:", error);
        return { success: false, error: "Failed to update leave type" };
    }
}

export async function toggleLeaveTypeStatus(id: number, organizationId: number) {
    try {
        const existing = await prisma.leaveType.findFirst({
            where: { id, organizationId },
        });

        if (!existing) {
            return { success: false, error: "Leave type not found" };
        }

        const leaveType = await prisma.leaveType.update({
            where: { id },
            data: { isActive: !existing.isActive },
        });
        revalidatePath("/leave/settings");
        return { success: true, data: leaveType };
    } catch (error) {
        console.error("Error toggling leave type status:", error);
        return { success: false, error: "Failed to toggle status" };
    }
}
