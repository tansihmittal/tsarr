import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" data-theme="bumblebee">
      <Head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon and App Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#4f46e5" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Roboto:wght@100;300;400;500;700;900&family=Montserrat:wght@100;200;300;400;500;600;700;800;900&family=Poppins:wght@100;200;300;400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700;800;900&family=Bebas+Neue&family=Anton&family=Oswald:wght@200;300;400;500;600;700&family=Lobster&family=Pacifico&family=Dancing+Script:wght@400;500;600;700&family=Permanent+Marker&family=Bangers&family=Abril+Fatface&family=Alfa+Slab+One&family=Caveat:wght@400;500;600;700&family=Indie+Flower&family=Shadows+Into+Light&family=Patrick+Hand&family=Gloria+Hallelujah&display=swap"
          rel="stylesheet"
        />
        
        {/* DNS Prefetch for external resources */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
