import Head from "next/head";
import Link from "next/link";
import { BsArrowRight, BsGithub, BsTwitter, BsLinkedin, BsCheck } from "react-icons/bs";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

      <div
        className="min-h-screen bg-white dark:bg-gray-900 text-[#0A0A0A] dark:text-white antialiased"
        style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
      >
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-[#E5E7EB] dark:border-gray-700">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold text-[#0A0A0A] dark:text-white tracking-tight">
              tsarr.in
            </Link>
            <nav className="flex items-center gap-1">
              <Button variant="ghost" asChild className="text-sm text-[#4B5563] dark:text-gray-400 hover:text-[#0A0A0A] dark:text-white dark:hover:text-white">
                <Link href="/tools">Tools</Link>
              </Button>
              <Button asChild className="ml-3 text-sm font-medium rounded-[10px]">
                <Link href={href}>Open {title}</Link>
              </Button>
            </nav>
          </div>
        </header>

        <main>
          {/* Hero */}
          <section className="pt-16 pb-12 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-2 text-sm text-[#4B5563] dark:text-gray-400 mb-6">
                <Link href="/" className="hover:text-[#0A0A0A] dark:text-white dark:hover:text-white">Home</Link>
                <span>/</span>
                <Link href="/tools" className="hover:text-[#0A0A0A] dark:text-white dark:hover:text-white">Tools</Link>
                <span>/</span>
                <span className="text-[#0A0A0A] dark:text-white">{title}</span>
              </div>

              <div className="flex items-start gap-6 mb-8">
                <div className="w-16 h-16 flex items-center justify-center bg-[#F9FAFB] dark:bg-gray-800/50 text-[#4B5563] dark:text-gray-400 rounded-[20px] flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <Badge variant="outline" className="text-xs font-medium text-[#4B5563] dark:text-gray-400 bg-[#F9FAFB] dark:bg-gray-800/50 px-2 py-0.5 rounded mb-2 inline-block">
                    {category}
                  </Badge>
                  <h1 className="text-4xl font-semibold text-[#0A0A0A] dark:text-white tracking-tight mb-2">
                    {title}
                  </h1>
                  <p className="text-lg text-[#4B5563] dark:text-gray-400">
                    {description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="text-sm font-medium rounded-[10px]">
                  <Link href={href} className="inline-flex items-center gap-2">
                    Open {title}
                    <BsArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="secondary" asChild className="text-sm font-medium rounded-[10px]">
                  <Link href="/tools">View All Tools</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* About */}
          <section className="py-12 px-6 bg-[#F9FAFB] dark:bg-gray-800/50 border-y border-[#E5E7EB] dark:border-gray-700">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                  <h2 className="text-2xl font-semibold text-[#0A0A0A] dark:text-white tracking-tight mb-4">
                    About this tool
                  </h2>
                  <p className="text-[#4B5563] dark:text-gray-400 leading-relaxed">
                    {longDescription}
                  </p>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-[#0A0A0A] dark:text-white tracking-tight mb-4">
                    Features
                  </h2>
                  <ul className="space-y-3">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <BsCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-[#4B5563] dark:text-gray-400">{feature}</span>
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
              <h2 className="text-2xl font-semibold text-[#0A0A0A] dark:text-white tracking-tight mb-6">
                Use cases
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {useCases.map((useCase, i) => (
                  <div key={i} className="p-4 rounded-[14px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900">
                    <p className="text-[#4B5563] dark:text-gray-400">{useCase}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Related Tools */}
          {relatedTools.length > 0 && (
            <section className="py-12 px-6 bg-[#F9FAFB] dark:bg-gray-800/50 border-t border-[#E5E7EB] dark:border-gray-700">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-semibold text-[#0A0A0A] dark:text-white tracking-tight mb-6">
                  Related tools
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {relatedTools.map((tool, i) => (
                    <Link
                      key={i}
                      href={tool.href}
                      className="group flex items-center gap-3 p-4 rounded-[14px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-[#F9FAFB] dark:bg-gray-800/50 text-[#4B5563] dark:text-gray-400 rounded-[10px] group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors flex-shrink-0">
                        {tool.icon}
                      </div>
                      <span className="font-medium text-[#0A0A0A] dark:text-white">{tool.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="py-16 px-6 bg-[#0A0A0A] text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-semibold tracking-tight mb-4">
                Ready to try {title}?
              </h2>
              <p className="text-[#4B5563] dark:text-gray-400 mb-6">
                Free to use, no login required. Start creating in seconds.
              </p>
              <Button
                asChild
                variant="secondary"
                className="text-sm font-medium rounded-[10px] bg-white text-[#0A0A0A] dark:text-white hover:bg-gray-100 dark:bg-gray-800"
              >
                <Link href={href} className="inline-flex items-center gap-2">
                  Open {title}
                  <BsArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-[#4B5563] dark:text-gray-400">
                © 2025 tsarr.in. Created by{" "}
                <a href="https://tanishmittal.com/" target="_blank" rel="noopener noreferrer" className="text-[#0A0A0A] dark:text-white hover:text-gray-900 dark:hover:text-white transition-colors">
                  Tanish Mittal
                </a>
              </p>
              <div className="flex items-center gap-4">
                <a href="https://github.com/tansihmittal/" target="_blank" rel="noopener noreferrer" className="text-[#4B5563]/60 dark:text-gray-400/60 hover:text-[#4B5563] dark:text-gray-400 transition-colors">
                  <BsGithub className="w-5 h-5" />
                </a>
                <a href="https://x.com/glowdopera" target="_blank" rel="noopener noreferrer" className="text-[#4B5563]/60 dark:text-gray-400/60 hover:text-[#4B5563] dark:text-gray-400 transition-colors">
                  <BsTwitter className="w-5 h-5" />
                </a>
                <a href="https://linkedin.com/in/tanishmittal02" target="_blank" rel="noopener noreferrer" className="text-[#4B5563]/60 dark:text-gray-400/60 hover:text-[#4B5563] dark:text-gray-400 transition-colors">
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
