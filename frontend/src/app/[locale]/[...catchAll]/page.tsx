export async function generateStaticParams() {
  return [
    { locale: 'vi', catchAll: ['404'] },
    { locale: 'en', catchAll: ['404'] },
  ];
}

export default function CatchAllNotFound() {
  return <div className="p-8 text-center text-white">404 - Not Found</div>;
}
