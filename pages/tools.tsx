import Head from "next/head";
import Link from "next/link";
import { BsArrowRight, BsGithub, BsTwitter, BsLinkedin } from "react-icons/bs";
import { toolsData } from "@/data/toolsData";

const toolsListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "tsarr.in Tools",
  description: "19+ free online image and video tools",
  numberOfItems: toolsData.length,
  itemListElement: toolsData.map((tool, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: tool.title,
    description: tool.shortDesc,
    url: `https://tsarr.in/tool/${tool.slug}`
  }))
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://tsarr.in" },
    { "@type": "ListItem", position: 2, name: "Tools", item: "https://tsarr.in/tools" }
  ]
};

export default function ToolsPage() {
  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>All 19+ Free Image and Video Tools | tsarr.in</title>
        <meta name="title" content="All 19+ Free Image and Video Tools | tsarr.in" />
        <meta name="description" content="Browse all 19+ free online tools: screenshot editor, code screenshots, video captions, image converter, text to speech, watermark remover, and more. No login required, works in browser." />
        <meta name="keywords" content="free image tools, online video tools, screenshot editor, code screenshot, image converter, video captions, text to speech, watermark remover, free online tools" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://tsarr.in/tools" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tsarr.in/tools" />
        <meta property="og:title" content="All 19+ Free Image and Video Tools | tsarr.in" />
        <meta property="og:description" content="Browse all 19+ free online tools. Screenshot editor, code screenshots, video captions, and more. No login required." />
        <meta property="og:image" content="https://tsarr.in/images/og-image.png" />
        <meta property="og:site_name" content="tsarr.in" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="All 19+ Free Image and Video Tools | tsarr.in" />
        <meta name="twitter:description" content="Browse all 19+ free online tools. No login required." />
        <meta name="twitter:image" content="https://tsarr.in/images/og-image.png" />

        {/* Structured Data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolsListSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <div className="min-h-screen bg-white text-gray-900 antialiased">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold text-gray-900 tracking-tight">
              tsarr.in
            </Link>
            <nav className="flex items-center gap-1">
              <Link href="/tools" className="px-3 py-2 text-sm text-gray-900 font-medium">
                Tools
              </Link>
              <Link href="/code" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
                Code Editor
              </Link>
              <Link href="/editor" className="ml-3 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                Open Editor
              </Link>
            </nav>
          </div>
        </header>

        <main>
          {/* Hero */}
          <section className="pt-16 pb-12 px-6 border-b border-gray-100">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-4xl font-semibold text-gray-900 tracking-tight mb-4">
                All Tools
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                19+ free tools for screenshots, images, videos, and more. No login required, 
                everything runs in your browser.
              </p>
            </div>
          </section>

          {/* Tools Grid */}
          <section className="py-12 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {toolsData.map((tool, i) => (
                  <Link
                    key={i}
                    href={`/tool/${tool.slug}`}
                    className="group block p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-100 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h2 className="font-semibold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors">
                          {tool.title}
                        </h2>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {tool.category}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      {tool.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {tool.features.slice(0, 3).map((feature, j) => (
                        <span key={j} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                          {feature}
                        </span>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                        Learn more
                      </span>
                      <BsArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 px-6 bg-gray-50 border-t border-gray-100">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-4">
                Start creating now
              </h2>
              <p className="text-gray-600 mb-6">
                All tools are free and require no login. Pick one and get started.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/editor" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                  Screenshot Editor
                  <BsArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/code" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                  Code Screenshots
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                © 2025 tsarr.in. Created by{" "}
                <a href="https://tanishmittal.com/" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-gray-900 transition-colors">
                  Tanish Mittal
                </a>
              </p>
              <div className="flex items-center gap-4">
                <a href="https://github.com/tansihmittal/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <BsGithub className="w-5 h-5" />
                </a>
                <a href="https://x.com/glowdopera" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <BsTwitter className="w-5 h-5" />
                </a>
                <a href="https://linkedin.com/in/tanishmittal02" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <BsLinkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
