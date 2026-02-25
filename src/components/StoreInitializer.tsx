'use client'

import { useRef } from 'react'
import { useStore } from '@/store/useStore'
import { Organization, User } from '@prisma/client'

interface StoreInitializerProps {
    user?: User | null
    organization?: Organization | null
}

export default function StoreInitializer({ user, organization }: StoreInitializerProps) {
    const initialized = useRef(false)
    if (!initialized.current) {
        if (user) {
            useStore.setState({ user })
        }
        if (organization) {
            useStore.setState({ organization })
        }
        initialized.current = true
    }
    return null
}
