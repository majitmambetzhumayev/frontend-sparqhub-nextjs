// src/context/AuthContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import api from '@/lib/axios'

type User = { id: number; username: string; credits_remaining: number; profile_picture: string | null; is_staff: boolean }
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
    await api.post('/api/auth/login/', { username, password })
    await init()
    router.push(`/${locale}/dashboard`)
  }

  // 3) logout
  async function logout() {
    await api.post('/api/auth/logout/')
    setUser(null)
    setStatus('unauthenticated')
    router.replace(`/${locale}/auth/login`)
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
