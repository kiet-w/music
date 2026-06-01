import React from 'react';
import LoginTemplate from '@/components/templates/LoginTemplate';

export default function LoginPage({ params: { locale } }: { params: { locale: string } }) {
  return <LoginTemplate locale={locale} />;
}
