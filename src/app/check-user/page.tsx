'use client'

import { useActionState } from 'react'
import { verifyUser } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useSearchParams } from 'next/navigation'

const initialState = {
    error: '',
}

export default function CheckUserPage() {
    const searchParams = useSearchParams()
    const organizationId = searchParams.get('organization_id')
    const [state, formAction, isPending] = useActionState(verifyUser, initialState)

    if (!organizationId) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive">ข้อผิดพลาด</CardTitle>
                        <CardDescription>ไม่พบรหัสองค์กร กรุณาลองใหม่อีกครั้ง</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>ยืนยันตัวตนพนักงาน</CardTitle>
                    <CardDescription>
                        กรุณากรอกรหัสพนักงานหรือเบอร์โทรศัพท์เพื่อเชื่อมต่อบัญชี
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <input type="hidden" name="organizationId" value={organizationId} />

                        <div className="space-y-2">
                            <Label htmlFor="identifier">รหัสพนักงาน / เบอร์โทรศัพท์</Label>
                            <Input
                                id="identifier"
                                name="identifier"
                                placeholder="เช่น A001 หรือ 0812345678"
                                required
                            />
                        </div>

                        {state?.error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                                {state.error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'กำลังตรวจสอบ...' : 'ยืนยันตัวตน'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
