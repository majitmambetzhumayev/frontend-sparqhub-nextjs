// src/components/RootQueryProvider.tsx
'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useToast } from '@/context/ToastContext'

// Lets a call site opt a specific query/mutation out of the generic error
// toast below — for the handful of places that already show their own
// contextual error message (an inline red line, a toast with a more
// specific string), so the user doesn't see two error notifications for
// the same failure.
declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: { skipGlobalErrorToast?: boolean }
    mutationMeta: { skipGlobalErrorToast?: boolean }
  }
}

// Not run through next-intl's useTranslations(): this provider is mounted
// in the root layout (app/layout.tsx), above [locale]/layout.tsx's
// NextIntlClientProvider, so that hook isn't available here — verified by
// reading the layout tree directly, not assumed. A small locale-aware
// dictionary for this one generic string is a pragmatic compromise over
// restructuring the provider tree (which would reset auth/query state on
// every locale switch) just to translate a single fallback message.
const GENERIC_ERROR_MESSAGE: Record<string, string> = {
  en: 'Something went wrong. Please try again.',
  fr: "Une erreur s'est produite. Réessaie.",
}

export default function RootQueryProvider({
  children,
}: { children: React.ReactNode }) {
  const { locale } = useParams() as { locale?: string }
  const { showToast } = useToast()

  const [queryClient] = useState(() => {
    const showGenericErrorToast = () => {
      showToast(GENERIC_ERROR_MESSAGE[locale ?? 'en'] ?? GENERIC_ERROR_MESSAGE.en)
    }

    return new QueryClient({
      queryCache: new QueryCache({
        onError: (_error, query) => {
          if (query.meta?.skipGlobalErrorToast) return
          showGenericErrorToast()
        },
      }),
      mutationCache: new MutationCache({
        onError: (_error, _variables, _context, mutation) => {
          if (mutation.meta?.skipGlobalErrorToast) return
          showGenericErrorToast()
        },
      }),
    })
  })

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
