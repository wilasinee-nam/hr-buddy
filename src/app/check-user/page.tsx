'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useSearchParams } from 'next/navigation'

export default function CheckUserPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const organizationId = searchParams.get('organization_id')
    const [error, setError] = useState('')
    const [isPending, setIsPending] = useState(false)

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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        setIsPending(true)

        const formData = new FormData(e.currentTarget)
        const identifier = formData.get('identifier') as string

        try {
            const res = await fetch('/api/check-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, organizationId }),
            })

            const data = await res.json()

            if (data.error) {
                setError(data.error)
            } else if (data.success) {
                router.push('/home')
            }
        } catch {
            setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
        } finally {
            setIsPending(false)
        }
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
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="identifier">รหัสพนักงาน / เบอร์โทรศัพท์</Label>
                            <Input
                                id="identifier"
                                name="identifier"
                                placeholder="เช่น A001 หรือ 0812345678"
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                                {error}
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
