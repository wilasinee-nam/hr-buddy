import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const channelId = searchParams.get('channel_id')
    console.log('channelId ', searchParams)
    if (!channelId) {
        return NextResponse.redirect(new URL('/organization-not-found', request.url))
    }

    try {
        const org = await prisma.organization.findFirst({
            where: {
                oaChannelId: channelId
            }
        })

        if (!org) {
            return NextResponse.redirect(new URL('/organization-not-found', request.url))
        }

        const cookieStore = await cookies()
        cookieStore.set('org_channel_id', org.oaChannelId!)
        cookieStore.set('organization_id', org.id.toString())

        // Redirect to LINE Login
        const lineLoginUrl = new URL('https://access.line.me/oauth2/v2.1/authorize')
        lineLoginUrl.searchParams.append('response_type', 'code')
        lineLoginUrl.searchParams.append('client_id', org.channelId!)
        const redirectUri = (process.env.LINE_REDIRECT_URI).trim().replace(/^["']|["']$/g, '');
        lineLoginUrl.searchParams.append('redirect_uri', redirectUri)
        lineLoginUrl.searchParams.append('state', Math.random().toString(36).substring(7))
        lineLoginUrl.searchParams.append('scope', 'profile openid email')
        // console.log("lineLoginUrl ", redirectUri)
        return NextResponse.redirect(lineLoginUrl.toString())

    } catch (error) {
        console.error('❌ [Auth Login] Error:', error)
        return NextResponse.redirect(new URL('/introduction?error=LOGIN_FATAL', request.url))
    }
}
