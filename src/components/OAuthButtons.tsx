'use client';

import { useTranslations } from 'next-intl';

export default function OAuthButtons() {
  const t = useTranslations('auth.oauth');
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  return (
    <div className="my-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">{t('orDivider')}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="space-y-2">
        {/* Plain full-navigation links, not fetch/XHR — this has to be a
            real top-level redirect to Google/GitHub's own domain. */}
        <a
          href={`${backendUrl}/api/auth/oauth/google/login/`}
          className="flex items-center justify-center w-full py-2 px-4 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          {t('continueWithGoogle')}
        </a>
        <a
          href={`${backendUrl}/api/auth/oauth/github/login/`}
          className="flex items-center justify-center w-full py-2 px-4 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          {t('continueWithGithub')}
        </a>
      </div>
    </div>
  );
}
