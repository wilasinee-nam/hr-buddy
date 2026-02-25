'use server'

import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function verifyUser(prevState: any, formData: FormData) {
    const identifier = formData.get('identifier') as string
    const organizationId = formData.get('organizationId') as string

    if (!identifier) {
        return { error: 'กรุณากรอกรหัสพนักงานหรือเบอร์โทรศัพท์' }
    }

    const cookieStore = await cookies()
    const lineUserDataStr = cookieStore.get('line_user_data')?.value

    if (!lineUserDataStr) {
        return { error: 'ไม่พบข้อมูล LINE กรุณาเข้าสู่ระบบใหม่อีกครั้ง' }
    }

    const lineUser = JSON.parse(lineUserDataStr)

    try {
        // Find user by employeeId OR phoneNumber AND organizationId
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
            return { error: 'ไม่พบข้อมูลพนักงานในระบบ กรุณาติดต่อ HR' }
        }

        if (user.lineUserId) {
            return { error: 'พนักงานคนนี้ได้ลงทะเบียน LINE ไว้แล้ว' }
        }

        // Update user with LINE info
        await prisma.user.update({
            where: { id: user.id },
            data: {
                lineUserId: lineUser.lineUserId,
                displayName: lineUser.displayName,
                pictureUrl: lineUser.pictureUrl,
                status: 'active'
            }
        })

        // Set session cookies
        cookieStore.set('app_user_id', String(user.id), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        })

        // Clear temp cookie
        cookieStore.delete('line_user_data')

    } catch (error) {
        console.error('Verify user error:', error)
        return { error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' }
    }

    redirect('/home')
}
