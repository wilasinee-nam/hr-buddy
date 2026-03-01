import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { identifier, organizationId } = body

    if (!identifier) {
        return NextResponse.json({ error: 'กรุณากรอกรหัสพนักงานหรือเบอร์โทรศัพท์' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const lineUserDataStr = cookieStore.get('line_user_data')?.value

    if (!lineUserDataStr) {
        return NextResponse.json({ error: 'ไม่พบข้อมูล LINE กรุณาเข้าสู่ระบบใหม่อีกครั้ง' }, { status: 400 })
    }

    const lineUser = JSON.parse(lineUserDataStr)

    try {
        const user = await prisma.user.findFirst({
            where: {
                organizationId: parseInt(organizationId),
                OR: [
                    { employeeId: identifier },
                    { phoneNumber: identifier }
                ]
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'ไม่พบข้อมูลพนักงานในระบบ กรุณาติดต่อ HR' }, { status: 404 })
        }

        if (user.lineUserId) {
            return NextResponse.json({ error: 'พนักงานคนนี้ได้ลงทะเบียน LINE ไว้แล้ว' }, { status: 409 })
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                lineUserId: lineUser.lineUserId,
                displayName: lineUser.displayName,
                pictureUrl: lineUser.pictureUrl,
                status: 'active'
            }
        })

        cookieStore.set('app_user_id', String(user.id), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7
        })

        cookieStore.delete('line_user_data')

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Verify user error:', error)
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' }, { status: 500 })
    }
}
