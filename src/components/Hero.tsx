import { useTranslations } from 'next-intl';

export default function Hero() {
  const t = useTranslations();

  return <h1>{t('tagline')}</h1>;
}
