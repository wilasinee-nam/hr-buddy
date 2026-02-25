import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function Page(props: { searchParams: Promise<{ channel_id?: string }> }) {
    const sp = await props.searchParams
    const cookieStore = await cookies()

    // 1. Check for existing session
    const orgChannelId = cookieStore.get('org_channel_id')?.value
    const organizationId = cookieStore.get('organization_id')?.value
    const appUserId = cookieStore.get('app_user_id')?.value

    // 2. If we have a channel_id from URL, we MUST start a fresh login flow to ensure we are in the right org context
    if (sp.channel_id) {
        // Redirect to our new Route Handler to set cookie and start LINE Login
        // encoded to handle special characters if any
        return redirect(`/api/auth/login?channel_id=${encodeURIComponent(sp.channel_id)}`)
    }

    // 3. If no channel_id in URL, but we have a cookie, we *could* let them stay,
    //    BUT the original logic implies we always want to ensure LINE Login or at least checks.
    //    If the user has a cookie, they might be visiting "/" directly.
    if (orgChannelId) {
        // Check if user is also logged in?
        if (appUserId) {
            return redirect('/home')
        }

        // For now, let's assume if they have org_channel_id but no user_id, they need to login.
        // If they have both, maybe go to dashboard?
        // The previous logic ALWAYS redirected to LINE Login. Let's stick to that for safety/consistency for now,
        // using the cookie's org ID.
        return redirect(`/api/auth/login?channel_id=${encodeURIComponent(orgChannelId)}`)
    }

    // 4. No channel_id in URL AND No cookie -> 404 behavior
    return redirect('/organization-not-found?error=NO_CHANNEL_ID')
}