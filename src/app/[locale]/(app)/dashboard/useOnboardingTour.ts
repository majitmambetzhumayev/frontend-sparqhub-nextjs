'use client';

import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTranslations } from 'next-intl';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

// Shown once, right after a user's very first login -- gated on
// user.has_seen_onboarding (backend field, not localStorage, so it
// survives a different browser/device). Every step is anchored on the
// dashboard itself; features with no dashboard element (memory, image
// generation, delegate_to_model) get a popover-only step instead of
// navigating the user to another page mid-tour.
export function useOnboardingTour() {
  const { user, refreshUser } = useAuth();
  const t = useTranslations('onboarding');

  useEffect(() => {
    if (!user || user.has_seen_onboarding) return;

    const tourDriver = driver({
      showProgress: true,
      nextBtnText: t('next'),
      prevBtnText: t('prev'),
      doneBtnText: t('done'),
      onDestroyStarted: () => {
        api.post('/api/auth/onboarding-seen/').catch(() => {});
        refreshUser();
        tourDriver.destroy();
      },
      steps: [
        { popover: { title: t('welcome.title'), description: t('welcome.description') } },
        {
          element: '[data-tour="new-conversation"]',
          popover: { title: t('chat.title'), description: t('chat.description') },
        },
        { popover: { title: t('memory.title'), description: t('memory.description') } },
        { popover: { title: t('images.title'), description: t('images.description') } },
        { popover: { title: t('delegate.title'), description: t('delegate.description') } },
        {
          element: '[data-tour="usage-widget"]',
          popover: { title: t('credits.title'), description: t('credits.description') },
        },
        {
          element: '[data-tour="projects-section"]',
          popover: { title: t('projects.title'), description: t('projects.description') },
        },
        {
          element: '[data-tour="recent-conversations"]',
          popover: { title: t('titles.title'), description: t('titles.description') },
        },
      ],
    });

    tourDriver.drive();

    return () => tourDriver.destroy();
    // Only re-run if the tour's own trigger condition changes -- not on
    // every refreshUser()-driven re-render, which would restart the tour
    // mid-flight from step 0.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.has_seen_onboarding]);
}
