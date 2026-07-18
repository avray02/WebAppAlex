import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  AuthContext,
  type AuthContextValue,
  type DemoUser,
  type UserAccessProfile,
} from './authContext'
import { auth, db, firebaseMode } from './firebase'

const demoUser: DemoUser = {
  uid: 'local-demo-user',
  email: 'demo@local.app',
  displayName: 'Alexandre',
}

const demoProfile: UserAccessProfile = {
  email: demoUser.email ?? '',
  displayName: demoUser.displayName ?? '',
  allowedApps: ['*'],
}

type AuthorizationState = {
  profile: UserAccessProfile | null
  isAdmin: boolean
  error: string | null
}

const initialAuthorization: AuthorizationState = {
  profile: firebaseMode === 'demo' ? demoProfile : null,
  isAdmin: firebaseMode === 'demo',
  error: null,
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(
    firebaseMode === 'demo' ? demoUser : null,
  )
  const [authorization, setAuthorization] =
    useState<AuthorizationState>(initialAuthorization)
  const [isLoading, setIsLoading] = useState(firebaseMode === 'firebase')

  useEffect(() => {
    if (!auth || !db) {
      return undefined
    }

    return onAuthStateChanged(auth, (nextUser) => {
      void loadSession(nextUser)
    })

    async function loadSession(nextUser: User | null) {
      if (!nextUser || !db) {
        setUser(null)
        setAuthorization({ profile: null, isAdmin: false, error: null })
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const [adminSnapshot, profileSnapshot] = await Promise.all([
          getDoc(doc(db, 'admins', nextUser.uid)),
          getDoc(doc(db, 'users', nextUser.uid)),
        ])
        const profile = profileSnapshot.exists()
          ? parseProfile(profileSnapshot.data())
          : await createInitialProfile(nextUser)

        setUser(nextUser)
        setAuthorization({
          profile,
          isAdmin: adminSnapshot.exists(),
          error: null,
        })
      } catch (error) {
        console.error('DailyMe authorization failed', error)
        setUser(nextUser)
        setAuthorization({
          profile: null,
          isAdmin: false,
          error:
            "Impossible de verifier les autorisations. Verifie Firestore et ses regles de securite.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    async function createInitialProfile(nextUser: User) {
      if (!db) {
        throw new Error('Firestore is not initialized')
      }

      const profile: UserAccessProfile = {
        email: nextUser.email ?? '',
        displayName: nextUser.displayName ?? '',
        allowedApps: [],
      }

      await setDoc(doc(db, 'users', nextUser.uid), {
        ...profile,
        createdAt: serverTimestamp(),
      })

      return profile
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth) {
      setUser(demoUser)
      return
    }

    setIsLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!auth) {
      setUser(demoUser)
      return
    }

    setIsLoading(true)
    await firebaseSignOut(auth)
  }, [])

  const hasAppAccess = useCallback(
    (appId: string) =>
      authorization.isAdmin ||
      Boolean(
        authorization.profile?.allowedApps.includes('*') ||
          authorization.profile?.allowedApps.includes(appId),
      ),
    [authorization.isAdmin, authorization.profile],
  )

  const value = useMemo(
    () => ({
      user,
      profile: authorization.profile,
      isAdmin: authorization.isAdmin,
      isLoading,
      authorizationError: authorization.error,
      authMode: firebaseMode,
      hasAppAccess,
      signIn,
      signOut,
    }),
    [authorization, hasAppAccess, isLoading, signIn, signOut, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function parseProfile(data: Record<string, unknown>): UserAccessProfile {
  return {
    email: typeof data.email === 'string' ? data.email : '',
    displayName: typeof data.displayName === 'string' ? data.displayName : '',
    allowedApps: Array.isArray(data.allowedApps)
      ? data.allowedApps.filter(
          (appId): appId is string => typeof appId === 'string',
        )
      : [],
  }
}
