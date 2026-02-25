import { NextRequest, NextResponse } from "next/server"
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    const redirectTo = searchParams.get('redirect_to') || '/organization-not-found'

    const cookieStore = await cookies()

    // Clear cookies
    cookieStore.delete('app_user_id')
    cookieStore.delete('org_channel_id')
    cookieStore.delete('organization_id')

    return NextResponse.redirect(new URL(redirectTo, baseUrl || request.url))
}
