import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

// Helper to get today's date at midnight for querying
function getTodayDate() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
}

function calculateLateMinutes(user: any, checkTime: Date): number {
    let lateMinutes = 0;
    let expectedStartTimeStr: string | null = null;
    
    if (!checkTime) return 0;

    const dayOfWeek = checkTime.getDay();
    const activeSchedule = user?.workSchedules?.find((ws: any) => {
        const days = ws.workDays as number[];
        return Array.isArray(days) && days.includes(dayOfWeek);
    });

    if (activeSchedule && activeSchedule.startTime) {
        expectedStartTimeStr = activeSchedule.startTime;
    } else if (user?.workTime) {
        const parts = user.workTime.split('-');
        expectedStartTimeStr = parts[0].trim();
    }

    if (expectedStartTimeStr) {
        const timeParts = expectedStartTimeStr.split(':');
        if (timeParts.length >= 2) {
            const expectedHour = parseInt(timeParts[0], 10);
            const expectedMinute = parseInt(timeParts[1], 10);
            
            if (!isNaN(expectedHour) && !isNaN(expectedMinute)) {
                // allow grace period until the end of that minute
                const expectedTime = new Date(checkTime);
                expectedTime.setHours(expectedHour, expectedMinute, 59, 999); 
                
                if (checkTime > expectedTime) {
                    const exactExpectedTime = new Date(checkTime);
                    exactExpectedTime.setHours(expectedHour, expectedMinute, 0, 0);
                    const diffMs = checkTime.getTime() - exactExpectedTime.getTime();
                    lateMinutes = Math.floor(diffMs / 60000);
                }
            }
        }
    }
    
    return lateMinutes;
}

function getExpectedEndTimeStr(user: any, date: Date): string | null {
    const dayOfWeek = date.getDay();
    const activeSchedule = user?.workSchedules?.find((ws: any) => {
        const days = ws.workDays as number[];
        return Array.isArray(days) && days.includes(dayOfWeek);
    });

    if (activeSchedule && activeSchedule.endTime) {
        return activeSchedule.endTime;
    } else if (user?.workTime) {
        const parts = user.workTime.split('-');
        if (parts.length > 1) {
            return parts[1].trim();
        }
    }
    return null;
}

function calculateEarlyMinutes(user: any, checkTime: Date): number {
    let earlyMinutes = 0;
    
    if (!checkTime) return 0;
    
    const expectedEndTimeStr = getExpectedEndTimeStr(user, checkTime);

    if (expectedEndTimeStr) {
        const timeParts = expectedEndTimeStr.split(':');
        if (timeParts.length >= 2) {
            const expectedHour = parseInt(timeParts[0], 10);
            const expectedMinute = parseInt(timeParts[1], 10);
            
            if (!isNaN(expectedHour) && !isNaN(expectedMinute)) {
                const expectedTime = new Date(checkTime);
                expectedTime.setHours(expectedHour, expectedMinute, 0, 0); 
                
                if (checkTime < expectedTime) {
                    const diffMs = expectedTime.getTime() - checkTime.getTime();
                    earlyMinutes = Math.floor(diffMs / 60000);
                }
            }
        }
    }
    
    return earlyMinutes;
}

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const appUserId = cookieStore.get('app_user_id')?.value

        if (!appUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = parseInt(appUserId)

        // Find user and their branch
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { branchRel: true, workSchedules: true }
        })

        if (!user || !user.branchRel) {
            return NextResponse.json({ error: 'ไม่พบข้อมูลสาขาของพนักงาน' }, { status: 400 })
        }

        const today = getTodayDate()

        // Get daily attendance
        const dailyAttendance = await prisma.dailyAttendance.findFirst({
            where: {
                userId: userId,
                date: today
            }
        })

        let lateMinutes = 0;
        if (dailyAttendance?.checkIn && dailyAttendance?.isLate) {
            lateMinutes = calculateLateMinutes(user, dailyAttendance.checkIn);
        }

        let earlyMinutes = 0;
        if (dailyAttendance?.checkOut) {
            earlyMinutes = calculateEarlyMinutes(user, dailyAttendance.checkOut);
        }
        
        const expectedEndTimeStr = getExpectedEndTimeStr(user, today);

        return NextResponse.json({
            branch: user.branchRel,
            checkedIn: !!dailyAttendance?.checkIn,
            checkInTime: dailyAttendance?.checkIn || null,
            checkOutTime: dailyAttendance?.checkOut || null,
            isLate: dailyAttendance?.isLate || false,
            lateMinutes,
            isEarly: earlyMinutes > 0,
            earlyMinutes,
            expectedEndTime: expectedEndTimeStr
        })
    } catch (error) {
        console.error('Fetch attendance error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const appUserId = cookieStore.get('app_user_id')?.value

        if (!appUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = parseInt(appUserId)
        const body = await request.json()
        const { type, lat, lng, distance } = body

        if (!type || typeof lat !== 'number' || typeof lng !== 'number' || typeof distance !== 'number') {
            return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 })
        }

        // Get user and branch to check radius
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { 
                branchRel: true,
                workSchedules: true
            }
        })

        if (!user || !user.branchRel) {
            return NextResponse.json({ error: 'ไม่พบข้อมูลสาขาของพนักงาน' }, { status: 400 })
        }

        // Feature: Option 1 (Record anyway, but flag if out of bounds)
        const isWithinRadius = distance <= user.branchRel.radius
        const now = new Date()
        const today = getTodayDate()

        // --- Calculate if user is late ---
        const lateMinutes = calculateLateMinutes(user, now);
        const isLate = lateMinutes > 0;
        // ---------------------------------

        // Check if daily attendance exists for today
        let dailyAttendance = await prisma.dailyAttendance.findFirst({
            where: {
                userId,
                date: today
            }
        })

        if (dailyAttendance) {
            // Already checked in. Update check_out time for every subsequent press.
            dailyAttendance = await prisma.dailyAttendance.update({
                where: { id: dailyAttendance.id },
                data: {
                    checkOut: now
                }
            })
        } else {
            // First time pressing today: Record as check in
            dailyAttendance = await prisma.dailyAttendance.create({
                data: {
                    userId,
                    date: today,
                    checkIn: now,
                    isLate,
                    // checkOut remains null until pressed again
                }
            })
        }

        // Record the raw log
        await prisma.attendanceLog.create({
            data: {
                dailyAttendanceId: dailyAttendance.id,
                userId,
                type,
                lat,
                lng,
                distance,
                isWithinRadius,
                timestamp: now
            }
        })

        const outTime = dailyAttendance.checkOut as Date | null;
        let earlyMinutes = 0;
        if (outTime) {
            earlyMinutes = calculateEarlyMinutes(user, outTime);
        }

        return NextResponse.json({
            success: true,
            isWithinRadius,
            distance,
            checkInTime: dailyAttendance.checkIn,
            checkOutTime: dailyAttendance.checkOut,
            isLate: dailyAttendance.isLate,
            lateMinutes: dailyAttendance.isLate && dailyAttendance.checkIn 
                ? calculateLateMinutes(user, dailyAttendance.checkIn as Date) 
                : 0,
            isEarly: earlyMinutes > 0,
            earlyMinutes
        })

    } catch (error) {
        console.error('Submit attendance error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
