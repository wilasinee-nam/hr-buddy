"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getLeavesForApproval(userId: number) {
    try {
        // 1. Find which departments this user is an approver for
        const approverRecords = await prisma.departmentApprover.findMany({
            where: { approverId: userId },
            select: { departmentId: true },
        });

        const departmentIds = approverRecords.map((r) => r.departmentId);

        if (departmentIds.length === 0) {
            return [];
        }

        // 2. Find leave requests from users in those departments
        //    Exclude the approver's own requests (can't approve own leave)
        const requests = await prisma.leaveRequest.findMany({
            where: {
                user: {
                    departmentId: { in: departmentIds },
                },
                userId: { not: userId }, // Prevent self-approval if in same department
                status: "pending",
            },
            include: {
                user: {
                    select: {
                        name: true,
                        positionRel: { select: { name: true } },
                        departmentRel: { select: { name: true } },
                        pictureUrl: true,
                    },
                },
                leaveType: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return requests;
    } catch (error) {
        console.error("Error fetching leaves for approval:", error);
        return [];
    }
}

export async function approveLeaveRequest(
    requestId: number,
    approverId: number,
    status: "approved" | "rejected",
    rejectionReason?: string
) {
    try {
        const request = await prisma.leaveRequest.findUnique({
            where: { id: requestId },
            include: { leaveType: true },
        });

        if (!request) {
            throw new Error("Leave request not found");
        }

        if (request.status !== "pending") {
            throw new Error("Request is not pending");
        }

        await prisma.$transaction(async (tx) => {
            // 1. Update Request Status
            await tx.leaveRequest.update({
                where: { id: requestId },
                data: {
                    status,
                    approvedBy: approverId,
                    approvedAt: new Date(),
                    rejectionReason: status === "rejected" ? rejectionReason : null,
                },
            });

            // 2. Update Entitlement Balances
            // Find the specific entitlement for this user, leave type, and year
            const year = request.startDate.getFullYear();
            const entitlement = await tx.leaveEntitlement.findUnique({
                where: {
                    userId_leaveTypeId_year: {
                        userId: request.userId,
                        leaveTypeId: request.leaveTypeId,
                        year: year,
                    },
                },
            });

            if (entitlement) {
                if (status === "approved") {
                    // If approved:
                    // - Deduct from pending (it was moved from available to pending on submit)
                    // - Add to used
                    // Note: totalDays was already deducted from entitled/available implicitly by adding to pending?
                    // Let's check submit logic: usually pending reduces "available" display, but strictly:
                    // Available = Entitled - Used - Pending.
                    // On Submit: Pending += days.
                    // On Approve: Pending -= days, Used += days.
                    // On Reject: Pending -= days.

                    await tx.leaveEntitlement.update({
                        where: { id: entitlement.id },
                        data: {
                            pendingDays: { decrement: request.totalDays },
                            usedDays: { increment: request.totalDays },
                        },
                    });
                } else if (status === "rejected") {
                    // If rejected:
                    // - Deduct from pending (giving it back to available implicitly)
                    await tx.leaveEntitlement.update({
                        where: { id: entitlement.id },
                        data: {
                            pendingDays: { decrement: request.totalDays },
                        },
                    });
                }
            }
        });

        revalidatePath("/leave/approval");
        revalidatePath("/leave"); // Update dashboard too
        return { success: true };
    } catch (error: any) {
        console.error("Error approving/rejecting leave:", error);
        return { success: false, error: error.message };
    }
}
