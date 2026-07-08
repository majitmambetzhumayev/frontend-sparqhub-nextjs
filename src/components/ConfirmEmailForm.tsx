'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import api from '@/lib/axios';

export default function ConfirmEmailForm() {
  const { locale } = useParams() as { locale: string };
  const searchParams = useSearchParams();
  const t = useTranslations('auth.confirmEmail');

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'confirming' | 'success' | 'error'>('confirming');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || !token) {
      setStatus('error');
      setError(t('missingParams'));
      return;
    }

    let cancelled = false;
    api
      .post('/api/auth/confirm-email/', { uid, token })
      .then(() => {
        if (!cancelled) setStatus('success');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('error');
        if (
          isAxiosError(err) &&
          err.response?.data != null &&
          typeof err.response.data.error === 'string'
        ) {
          setError(err.response.data.error);
        } else {
          setError(t('invalidOrExpired'));
        }
      });

    return () => {
      cancelled = true;
    };
    // Runs once on mount with whatever uid/token were present in the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">{t('title')}</h2>

      {status === 'confirming' && <p className="text-gray-600">{t('confirming')}</p>}
      {status === 'success' && <p className="text-green-700">{t('successMessage')}</p>}
      {status === 'error' && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <p className="mt-4 text-center">
        <Link href={`/${locale}/auth/login`} className="text-blue-500 hover:underline">
          {t('goToLogin')}
        </Link>
      </p>
    </div>
  );
}
