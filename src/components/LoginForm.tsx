'use client';

import React, { useState, FormEvent, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { isAxiosError } from 'axios';
import { useAuth } from '@/context/AuthContext';
import OAuthButtons from './OAuthButtons';

type LoginFormProps = object;

// OAuthCallbackAPIView redirects failures here as ?error=<code> — read once
// on mount rather than reactively, since the only way this param changes is
// a fresh redirect (a full navigation, which remounts this component).
const OAUTH_ERROR_KEYS: Record<string, string> = {
  oauth_failed: 'oauth.errorFailed',
  oauth_no_email: 'oauth.errorNoEmail',
};

export default function LoginForm({}: LoginFormProps) {
  const { locale } = useParams() as { locale: string };
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const t = useTranslations('auth');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const oauthErrorCode = searchParams.get('error');
  const oauthErrorKey = oauthErrorCode ? OAUTH_ERROR_KEYS[oauthErrorCode] : undefined;
  const [error, setError] = useState<string | null>(oauthErrorKey ? t(oauthErrorKey) : null);
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
          setError(t('login.invalidCredentials'));
        }
      } finally {
        setLoading(false);
      }
    },
    [username, password, login, t]
  );

  return (
    <div className="max-w-md mx-auto">
      {/* Anthracite (neutral-900), distinct from the forest green used
          everywhere else, so this reads as an emphasized callout rather
          than blending into the rest of the brand palette -- moved above
          the form itself since the old bottom-of-form placement (small
          text, easy to miss) undersold what's actually the more likely
          first action for a new visitor. */}
      <div className="mb-4 p-4 bg-neutral-900 rounded-lg text-center">
        <p className="text-white">
          {t('login.noAccount')}{' '}
          <Link href={`/${locale}/auth/register`} className="font-semibold underline hover:text-neutral-300">
            {t('login.registerLink')}
          </Link>
        </p>
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">{t('login.title')}</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              {t('usernameLabel')}
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
              {t('passwordLabel')}
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
              loading ? 'bg-gray-400' : 'bg-forest-900 hover:bg-forest-800'
            }`}
          >
            {loading ? t('login.submitting') : t('login.submit')}
          </button>
        </form>

        <OAuthButtons />
      </div>
    </div>
  );
}
