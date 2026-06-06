import { Helmet } from "react-helmet-async";

interface SeoProps {
  title: string;
  description: string;
}

export function Seo({ title, description }: SeoProps) {
  return (
    <Helmet>
      <title>{title} | Innova Creations</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={window.location.href} />
    </Helmet>
  );
}
