import type { User } from 'firebase/auth'
import { createContext, useContext } from 'react'
import type { firebaseMode } from './firebase'

export type DemoUser = Pick<User, 'uid' | 'email' | 'displayName'>

export type UserAccessProfile = {
  email: string
  displayName: string
  allowedApps: string[]
}

export type AuthContextValue = {
  user: User | DemoUser | null
  profile: UserAccessProfile | null
  isAdmin: boolean
  isLoading: boolean
  authorizationError: string | null
  authMode: typeof firebaseMode
  hasAppAccess: (appId: string) => boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
