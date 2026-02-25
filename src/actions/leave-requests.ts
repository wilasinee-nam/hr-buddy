"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getEntitlements(userId: number, year: number) {
    try {
        const entitlements = await prisma.leaveEntitlement.findMany({
            where: {
                userId,
                year,
            },
            include: {
                leaveType: true,
            },
        });
        return entitlements;
    } catch (error) {
        console.error("Error fetching entitlements:", error);
        return [];
    }
}

export async function getLeaveRequests(userId: number, year?: number) {
    try {
        const whereClause: any = { userId };
        if (year) {
            // Filter by start date in the given year
            // This is a simple approximation
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31);
            whereClause.startDate = {
                gte: startDate,
                lte: endDate
            };
        }

        const requests = await prisma.leaveRequest.findMany({
            where: whereClause,
            include: {
                leaveType: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return requests;
    } catch (error) {
        console.error("Error fetching leave requests:", error);
        return [];
    }
}

export async function submitLeaveRequest(data: {
    userId: number;
    leaveTypeId: number;
    startDate: string;
    endDate: string;
    reason: string;
    documentUrl?: string;
}) {
    try {
        const { userId, leaveTypeId, startDate, endDate, reason, documentUrl } = data;
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Calculate total days (inclusive)
        // Simple calculation: difference in ms / ms per day + 1
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // 1. Check Entitlement
        const currentYear = start.getFullYear();
        const entitlement = await prisma.leaveEntitlement.findUnique({
            where: {
                userId_leaveTypeId_year: {
                    userId,
                    leaveTypeId,
                    year: currentYear
                }
            },
            include: { leaveType: true }
        });

        if (!entitlement) {
            // Check if leave type allows no entitlement (unlimited?)
            // If not found, check if leave type exists and if defaultDays is null (unlimited)
            const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
            if (!leaveType) throw new Error("Leave type not found");

            if (leaveType.defaultDays !== null) {
                throw new Error("No entitlement found for this leave type");
            }
            // If null, it means unlimited, so we proceed (maybe create entitlement on the fly or just request)
            // ideally we should have created entitlement during seeding or user creation.
            // For now, fail safe.
            throw new Error("No entitlement record found. Please contact HR.");
        }

        // Check balance
        const remaining = entitlement.entitledDays + entitlement.carryOverDays - entitlement.usedDays - entitlement.pendingDays;

        // If defaultDays is null, it might mean unlimited or special handling. 
        // Assuming if entitlement exists, we track it. 
        // If entitledDays is huge or 0 but allowed... logic depends on interpretation of 'unlimited'.
        // For now, strict check against remaining.
        // NOTE: SICK leave was seeded with 30.

        if (totalDays > remaining) {
            throw new Error(`Insufficient leave balance. Remaining: ${remaining}, Requested: ${totalDays}`);
        }

        // 2. Create Request inside a transaction to update pending balance atomically
        await prisma.$transaction(async (tx) => {
            // Create Request
            await tx.leaveRequest.create({
                data: {
                    userId,
                    leaveTypeId,
                    startDate: start,
                    endDate: end,
                    totalDays,
                    reason,
                    documentUrl,
                    status: "pending"
                }
            });

            // Update Entitlement Pending Days
            await tx.leaveEntitlement.update({
                where: { id: entitlement.id },
                data: {
                    pendingDays: entitlement.pendingDays + totalDays
                }
            });
        });

        revalidatePath("/leave");
        return { success: true };
    } catch (error: any) {
        console.error("Error submitting leave request:", error);
        return { success: false, error: error.message };
    }
}
