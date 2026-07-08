'use client';

import React, { useState, FormEvent, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import api from '@/lib/axios';

export default function ForgotPasswordForm() {
  const { locale } = useParams() as { locale: string };
  const t = useTranslations('auth.forgotPassword');
  const tAuth = useTranslations('auth');

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        await api.post('/api/auth/password-reset/request/', { email });
      } finally {
        // Same message whether or not the email is registered — the backend
        // never reveals that, so the frontend must not either.
        setLoading(false);
        setSubmitted(true);
      }
    },
    [email]
  );

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">{t('title')}</h2>

      {submitted ? (
        <p className="text-green-700">{t('successMessage')}</p>
      ) : (
        <>
          <p className="mb-4 text-gray-600">{t('description')}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                {tAuth('emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded text-white ${
                loading ? 'bg-gray-400' : 'bg-ink hover:bg-ink/90'
              }`}
            >
              {loading ? t('submitting') : t('submit')}
            </button>
          </form>
        </>
      )}

      <p className="mt-4 text-center">
        <Link href={`/${locale}/auth/login`} className="text-blue-500 hover:underline">
          {t('backToLogin')}
        </Link>
      </p>
    </div>
  );
}
