import { Suspense } from 'react';
import ConfirmEmailForm from '@/components/ConfirmEmailForm';

export default function ConfirmEmailPage() {
  return (
    <Suspense>
      <ConfirmEmailForm />
    </Suspense>
  );
}
