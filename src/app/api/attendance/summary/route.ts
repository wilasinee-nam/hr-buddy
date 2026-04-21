import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const appUserId = cookieStore.get('app_user_id')?.value

        if (!appUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = parseInt(appUserId)
        
        // Get start and end of current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Fetch daily attendances for the current month
        const attendances = await prisma.dailyAttendance.findMany({
            where: {
                userId,
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });

        const workDays = attendances.length;
        const lateDays = attendances.filter(a => a.isLate).length;

        // Fetch approved leave requests for the current month
        const leaveRequests = await prisma.leaveRequest.findMany({
            where: {
                userId,
                status: 'approved',
                // Check if any part of the leave falls within this month
                startDate: {
                    lte: endOfMonth
                },
                endDate: {
                    gte: startOfMonth
                }
            }
        });

        // Simple sum of totalDays for leave requests acting as estimate for this month
        let leaveDays = 0;
        leaveRequests.forEach(req => {
            leaveDays += req.totalDays;
        });

        // Absent days: requires more robust work schedule calculation, but will default to 0 for MVP
        const absentDays = 0;

        return NextResponse.json({
            workDays,
            lateDays,
            leaveDays,
            absentDays
        });
    } catch (error) {
        console.error('Fetch attendance summary error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
