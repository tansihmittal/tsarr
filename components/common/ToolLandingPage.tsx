import Head from "next/head";
import Link from "next/link";
import { BsArrowRight, BsGithub, BsTwitter, BsLinkedin, BsCheck } from "react-icons/bs";
import { ReactNode } from "react";

interface ToolLandingPageProps {
  title: string;
  description: string;
  longDescription: string;
  href: string;
  icon: ReactNode;
  features: string[];
  useCases: string[];
  category: string;
  relatedTools: { title: string; href: string; icon: ReactNode }[];
}

export default function ToolLandingPage({
  title,
  description,
  longDescription,
  href,
  icon,
  features,
  useCases,
  category,
  relatedTools,
}: ToolLandingPageProps) {
  return (
    <>
      <Head>
        <title>{title} - Free Online Tool | tsarr.in</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`https://tsarr.in${href}`} />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content={`${title} - tsarr.in`} />
        <meta property="og:description" content={description} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div className="min-h-screen bg-white text-gray-900 antialiased">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold text-gray-900 tracking-tight">
              tsarr.in
            </Link>
            <nav className="flex items-center gap-1">
              <Link href="/tools" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Tools
              </Link>
              <Link href={href} className="ml-3 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                Open {title}
              </Link>
            </nav>
          </div>
        </header>

        <main>
          {/* Hero */}
          <section className="pt-16 pb-12 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Link href="/" className="hover:text-gray-700">Home</Link>
                <span>/</span>
                <Link href="/tools" className="hover:text-gray-700">Tools</Link>
                <span>/</span>
                <span className="text-gray-900">{title}</span>
              </div>
              
              <div className="flex items-start gap-6 mb-8">
                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 text-gray-700 rounded-2xl flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded mb-2 inline-block">
                    {category}
                  </span>
                  <h1 className="text-4xl font-semibold text-gray-900 tracking-tight mb-2">
                    {title}
                  </h1>
                  <p className="text-lg text-gray-600">
                    {description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={href} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                  Open {title}
                  <BsArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/tools" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                  View All Tools
                </Link>
              </div>
            </div>
          </section>

          {/* About */}
          <section className="py-12 px-6 bg-gray-50 border-y border-gray-100">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-4">
                    About this tool
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    {longDescription}
                  </p>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-4">
                    Features
                  </h2>
                  <ul className="space-y-3">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <BsCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Use Cases */}
          <section className="py-12 px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-6">
                Use cases
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {useCases.map((useCase, i) => (
                  <div key={i} className="p-4 rounded-xl border border-gray-200 bg-white">
                    <p className="text-gray-700">{useCase}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Related Tools */}
          {relatedTools.length > 0 && (
            <section className="py-12 px-6 bg-gray-50 border-t border-gray-100">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-6">
                  Related tools
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {relatedTools.map((tool, i) => (
                    <Link
                      key={i}
                      href={tool.href}
                      className="group flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg group-hover:bg-gray-900 group-hover:text-white transition-colors flex-shrink-0">
                        {tool.icon}
                      </div>
                      <span className="font-medium text-gray-900">{tool.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="py-16 px-6 bg-gray-900 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-semibold tracking-tight mb-4">
                Ready to try {title}?
              </h2>
              <p className="text-gray-400 mb-6">
                Free to use, no login required. Start creating in seconds.
              </p>
              <Link href={href} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors">
                Open {title}
                <BsArrowRight className="w-4 h-4" />
              </Link>
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
