import { create } from 'zustand'
import { User, Organization } from '@prisma/client'

interface AppState {
    user: User | null
    organization: Organization | null
    setUser: (user: User | null) => void
    setOrganization: (org: Organization | null) => void
}

export const useStore = create<AppState>((set) => ({
    user: null,
    organization: null,
    setUser: (user) => set({ user }),
    setOrganization: (organization) => set({ organization }),
}))
