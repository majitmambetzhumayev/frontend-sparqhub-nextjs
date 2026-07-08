// src/app/auth/register/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RegistrationForm from '@/components/RegistrationForm';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (token) redirect(`/${locale}/dashboard`);

  return <RegistrationForm />;
}
