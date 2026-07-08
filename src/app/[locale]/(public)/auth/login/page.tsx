// src/app/auth/login/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/LoginForm';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (token) redirect(`/${locale}/dashboard`);

  return <LoginForm />;
}
