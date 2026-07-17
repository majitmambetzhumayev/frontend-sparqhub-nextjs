// src/context/AuthContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import api, { SESSION_EXPIRED_EVENT } from '@/lib/axios'

type User = {
  id: number
  username: string
  credits_remaining: number
  profile_picture: string | null
  is_staff: boolean
  has_seen_onboarding: boolean
}
type Status = 'loading'|'authenticated'|'unauthenticated'

interface AuthContextType {
  user: User | null
  status: Status
  login: (u: string, p: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { locale } = useParams() as { locale: string }
  const [user, setUser] = useState<User|null>(null)
  const [status, setStatus] = useState<Status>('loading')

  // 1) Initialisation auth
  async function init() {
    setStatus('loading')
    try {
      await api.get('/api/csrf/')
      const { data } = await api.get<{ user: User }>('/api/auth/me/')
      setUser(data.user)
      setStatus('authenticated')
    } catch {
      setUser(null)
      setStatus('unauthenticated')
    }
  }

  useEffect(() => { void init() }, [])

  // Fired by lib/axios.ts when a silent refresh attempt itself fails (the
  // refresh token cookie is gone/expired too) -- the server-side session is
  // already dead at that point, this just brings client state in sync with
  // it instead of leaving `status: 'authenticated'` stale while every
  // subsequent request quietly keeps failing.
  useEffect(() => {
    function onSessionExpired() {
      setUser(null)
      setStatus('unauthenticated')
      router.replace(`/${locale}/auth/login`)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
  }, [router, locale])

  // refresh the current user (e.g. to reflect credits_remaining after a chat turn)
  async function refreshUser() {
    try {
      const { data } = await api.get<{ user: User }>('/api/auth/me/')
      setUser(data.user)
    } catch {
      // ignore — a failed refresh shouldn't disrupt the current session state
    }
  }

  // 2) login
  async function login(username: string, password: string) {
    setStatus('loading')
    try {
      await api.post('/api/auth/login/', { username, password })
    } catch (err) {
      // Otherwise a failed attempt leaves status stuck on 'loading' forever
      // — nothing ever resets it since init() is only called on mount.
      setStatus('unauthenticated')
      throw err
    }
    await init()
    router.push(`/${locale}/dashboard`)
    // See logout()'s comment — same Router Cache staleness risk applies to
    // the protected route we're about to land on.
    router.refresh()
  }

  // 3) logout
  async function logout() {
    await api.post('/api/auth/logout/')
    setUser(null)
    setStatus('unauthenticated')
    router.replace(`/${locale}/auth/login`)
    // Protected routes (e.g. (app)/layout.tsx) decide access via a
    // server-side cookie check. Without this, the Router Cache can still
    // serve an already-rendered protected page from before logout on a
    // subsequent soft navigation, since Next has no way to know the cookie
    // just changed.
    router.refresh()
  }

  return (
    <AuthContext.Provider value={{ user, status, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be within AuthProvider')
  return ctx
}
