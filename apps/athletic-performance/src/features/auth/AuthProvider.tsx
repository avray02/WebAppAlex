import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { auth, firebaseMode } from '../../lib/firebase/config'
import { AuthContext, type AuthContextValue, type DemoUser } from './authContext'

const demoUser: DemoUser = {
  uid: 'local-demo-user',
  email: 'demo@local.app',
  displayName: 'Alexandre',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(
    firebaseMode === 'demo' ? demoUser : null,
  )
  const [isLoading, setIsLoading] = useState(firebaseMode === 'firebase')

  useEffect(() => {
    if (!auth) {
      return undefined
    }

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setIsLoading(false)
    })
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth) {
      setUser(demoUser)
      return
    }

    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const signOut = useCallback(async () => {
    if (!auth) {
      setUser(demoUser)
      return
    }

    await firebaseSignOut(auth)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, authMode: firebaseMode, signIn, signOut }),
    [isLoading, signIn, signOut, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
