import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'
import type { firebaseMode } from '../../lib/firebase/config'

export type DemoUser = Pick<User, 'uid' | 'email' | 'displayName'>

export type AuthContextValue = {
  user: User | DemoUser | null
  isLoading: boolean
  authMode: typeof firebaseMode
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
