import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return [
    { locale: 'vi', catchAll: ['404'] },
    { locale: 'en', catchAll: ['404'] },
  ];
}

export default function CatchAllNotFound() {
  notFound();
}
