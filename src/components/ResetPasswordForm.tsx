'use client';

import React, { useState, FormEvent, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import api from '@/lib/axios';

export default function ResetPasswordForm() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth.resetPassword');

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!uid || !token) {
        setError(t('missingParams'));
        return;
      }
      if (newPassword !== confirmPassword) {
        setError(t('passwordMismatch'));
        return;
      }
      if (newPassword.length < 8) {
        setError(t('passwordTooShort'));
        return;
      }

      setLoading(true);
      try {
        await api.post('/api/auth/password-reset/confirm/', {
          uid,
          token,
          new_password: newPassword,
        });
        setSuccess(true);
        setTimeout(() => router.push(`/${locale}/auth/login`), 2000);
      } catch (err: unknown) {
        if (
          isAxiosError(err) &&
          err.response?.data != null &&
          typeof err.response.data.error === 'string'
        ) {
          setError(err.response.data.error);
        } else {
          setError(t('invalidOrExpired'));
        }
      } finally {
        setLoading(false);
      }
    },
    [uid, token, newPassword, confirmPassword, locale, router, t]
  );

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">{t('title')}</h2>

      {success ? (
        <p className="text-green-700">{t('successMessage')}</p>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                {t('newPasswordLabel')}
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                {t('confirmPasswordLabel')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
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
          {t('goToLogin')}
        </Link>
      </p>
    </div>
  );
}
