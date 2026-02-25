import { NextRequest, NextResponse } from "next/server"
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
// user and organization repository



export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    const cookieStore = await cookies()
    const org_channel_id = cookieStore.get('org_channel_id')?.value
    if (error) {
        console.error('❌ [LINE Callback] Error during login:', error)
        return NextResponse.redirect(new URL('/introduction?error=LOGIN_DENIED', baseUrl || request.url))
    }

    if (!code) {
        return NextResponse.redirect(new URL('/introduction?error=NO_CODE', baseUrl || request.url))
    }
    try {
        const org = await prisma.organization.findFirst({
            where: {
                oaChannelId: org_channel_id
            }
        })
        if (!org) {
            return NextResponse.redirect(new URL('/introduction?error=ORG_NOT_FOUND', baseUrl || request.url))
        }

        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: process.env.LINE_REDIRECT_URI,
                client_id: org.channelId!,
                client_secret: org.lineChannelSecret!,
            }),
        })
        const tokenData = await tokenResponse.json()
        if (tokenResponse.ok) {
            const accessToken = tokenData.access_token
            const idToken = tokenData.id_token
            const refreshToken = tokenData.refresh_token
            const expiresIn = tokenData.expires_in
            const tokenType = tokenData.token_type
            const scope = tokenData.scope
            const idTokenPayload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString())
            const lineUserId = idTokenPayload.sub
            const lineUserEmail = idTokenPayload.email
            const lineUserName = idTokenPayload.name
            const lineUserPicture = idTokenPayload.picture
            const lineUser = {
                lineUserId,
                lineUserEmail,
                lineUserName,
                lineUserPicture,
            }
            //    look for user in db lineUserId
            const user = await prisma.user.findFirst({
                where: {
                    lineUserId: lineUserId,
                    organizationId: org.id
                }
            })
            let userId = user?.id
            if (!user) {
                // return NextResponse.redirect(new URL('/introduction?error=USER_NOT_FOUND', process.env.NEXT_PUBLIC_BASE_URL || request.url))
                console.log('❌ [LINE Callback] User not found')
                // create user
                const cookieStore = await cookies()
                cookieStore.set('line_user_data', JSON.stringify(lineUser), {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/',
                    maxAge: 60 * 60 * 24 * 1 // 1 day
                })
                return NextResponse.redirect(new URL(`/check-user?organization_id=${org.id}`, process.env.NEXT_PUBLIC_BASE_URL || request.url));
                const userData = await prisma.user.create({
                    data: {
                        lineUserId: lineUserId,
                        organizationId: org.id,
                        displayName: lineUserName,
                        pictureUrl: lineUserPicture,
                    }
                })
                userId = userData.id
            }

            // console.log('✅ [LINE Callback] User found:', user)

            // Set session cookie
            const cookieStore = await cookies()
            cookieStore.set('app_user_id', String(userId), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            })

            return NextResponse.redirect(new URL('/home', process.env.NEXT_PUBLIC_BASE_URL || request.url));
        }
        return NextResponse.redirect(new URL('/introduction?error=CALLBACK_FATAL', baseUrl || request.url))
    } catch (error) {
        console.error('❌ [LINE Callback] Fatal Error:', error)
        return NextResponse.redirect(new URL('/introduction?error=CALLBACK_FATAL', baseUrl || request.url))
    }



}