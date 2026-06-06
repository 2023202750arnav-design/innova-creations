import { Seo } from "../components/Seo";

interface StaticPageProps {
  title: string;
}

export function StaticPage({ title }: StaticPageProps) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Seo title={title} description={`${title} at Innova Creations`} />
      <h1 className="font-display text-6xl text-navy">{title}</h1>
      <p className="mt-4 text-lg text-mid leading-relaxed">
        Innova Creations provides premium lights, chandeliers, custom design assistance,
        pan-India delivery, secure payments, easy returns, and attentive support for
        homes, stores, hotels, and studios.
      </p>
    </main>
  );
}
