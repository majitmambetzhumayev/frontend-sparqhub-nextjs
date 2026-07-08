'use client';

import React, { useState, FormEvent, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { isAxiosError } from 'axios';
import { useAuth } from '@/context/AuthContext';
import OAuthButtons from './OAuthButtons';

type LoginFormProps = object;

export default function LoginForm({}: LoginFormProps) {
  const { locale } = useParams() as { locale: string };
  const { login } = useAuth();
  const t = useTranslations('auth');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      try {
        // login() owns the whole flow: the POST, syncing AuthContext's
        // user/status, and the redirect + cache refresh.
        await login(username, password);
      } catch (err: unknown) {
        if (isAxiosError(err) && err.response?.status === 403) {
          // Login is gated on email confirmation — surfaced distinctly
          // from invalid-credentials so the user knows to check their inbox.
          setError(t('login.emailNotVerified'));
        } else if (
          isAxiosError(err) &&
          err.response?.data != null &&
          typeof err.response.data.detail === 'string'
        ) {
          setError(err.response.data.detail);
        } else {
          setError('Invalid username or password');
        }
      } finally {
        setLoading(false);
      }
    },
    [username, password, login, t]
  );

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Login</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
          />
          <div className="text-right mt-1">
            <Link
              href={`/${locale}/auth/forgot-password`}
              className="text-sm text-blue-500 hover:underline"
            >
              {t('forgotPasswordLink')}
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded text-white ${
            loading ? 'bg-gray-400' : 'bg-ink hover:bg-ink/90'
          }`}
        >
          {loading ? 'Logging in…' : 'Log In'}
        </button>
      </form>

      <OAuthButtons />
    </div>
  );
}
