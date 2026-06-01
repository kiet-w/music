import React from 'react';
import RegisterTemplate from '@/components/templates/RegisterTemplate';

export default function RegisterPage({ params: { locale } }: { params: { locale: string } }) {
  return <RegisterTemplate locale={locale} />;
}
