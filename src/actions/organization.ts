"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getOrganizationDetails(organizationId: number) {
    try {
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            include: {
                departments: {
                    include: {
                        departmentApprovers: {
                            include: {
                                approver: {
                                    select: {
                                        id: true,
                                        name: true,
                                        positionRel: { select: { name: true } },
                                    },
                                },
                            },
                            orderBy: { order: "asc" },
                        },
                        _count: {
                            select: { users: true },
                        },
                    },
                },
                users: {
                    where: { status: "active" },
                    select: {
                        id: true,
                        name: true,
                        positionRel: { select: { name: true } },
                        departmentId: true,
                        pictureUrl: true,
                    },
                },
            },
        });

        if (!organization) {
            throw new Error("Organization not found");
        }

        return { success: true, data: organization };
    } catch (error: any) {
        console.error("Error fetching organization details:", error);
        return { success: false, error: error.message };
    }
}

export async function createDepartment(organizationId: number, name: string) {
    try {
        // Check if department already exists
        const existing = await prisma.department.findFirst({
            where: {
                organizationId,
                name,
            },
        });

        if (existing) {
            return { success: false, error: "Department already exists" };
        }

        await prisma.department.create({
            data: {
                organizationId,
                name,
            },
        });
        revalidatePath("/organization");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteDepartment(departmentId: number) {
    try {
        // Check if department has users
        const userCount = await prisma.user.count({
            where: { departmentId },
        });

        if (userCount > 0) {
            return { success: false, error: "Cannot delete department with employees" };
        }

        // Delete approvers first
        await prisma.departmentApprover.deleteMany({
            where: { departmentId },
        });

        await prisma.department.delete({
            where: { id: departmentId },
        });

        revalidatePath("/organization");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function addApproverToDepartment(
    departmentId: number,
    approverId: number,
    order: number
) {
    try {
        // Check if already an approver
        const existing = await prisma.departmentApprover.findFirst({
            where: {
                departmentId,
                approverId,
            },
        });

        if (existing) {
            return { success: false, error: "User is already an approver for this department" };
        }

        await prisma.departmentApprover.create({
            data: {
                departmentId,
                approverId,
                order,
            },
        });

        revalidatePath("/organization");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function removeApproverFromDepartment(
    departmentId: number,
    approverId: number
) {
    try {
        await prisma.departmentApprover.deleteMany({
            where: {
                departmentId,
                approverId,
            },
        });

        // Reorder remaining approvers
        const remaining = await prisma.departmentApprover.findMany({
            where: { departmentId },
            orderBy: { order: "asc" },
        });

        for (let i = 0; i < remaining.length; i++) {
            await prisma.departmentApprover.update({
                where: { id: remaining[i].id },
                data: { order: i + 1 }
            })
        }

        revalidatePath("/organization");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
