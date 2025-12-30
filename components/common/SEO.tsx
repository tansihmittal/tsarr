import Head from "next/head";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product";
  keywords?: string[];
  noindex?: boolean;
  structuredData?: object;
}

export default function SEO({
  title,
  description,
  canonical,
  ogImage = "https://tsarr.in/images/og-image.png",
  ogType = "website",
  keywords = [],
  noindex = false,
  structuredData,
}: SEOProps) {
  const fullTitle = title.includes("tsarr.in") ? title : `${title} | tsarr.in`;
  const url = canonical || "https://tsarr.in";

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(", ")} />}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="tsarr.in" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:creator" content="@mittaltani36318" />
      <meta name="twitter:site" content="@mittaltani36318" />

      {/* Additional SEO */}
      <meta name="author" content="Tanish Mittal" />
      <meta name="publisher" content="tsarr.in" />
      <meta name="theme-color" content="#111827" />
      <meta name="apple-mobile-web-app-title" content="tsarr.in" />
      <meta name="application-name" content="tsarr.in" />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
    </Head>
  );
}
