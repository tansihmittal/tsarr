import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { BsArrowRight, BsGithub, BsTwitter, BsLinkedin, BsCheck, BsArrowLeft } from "react-icons/bs";
import { toolsData, ToolData } from "@/data/toolsData";

interface ToolPageProps {
  tool: ToolData;
  relatedTools: ToolData[];
}

export default function ToolPage({ tool, relatedTools }: ToolPageProps) {
  // Structured Data for this specific tool
  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.title,
    description: tool.longDescription,
    url: `https://tsarr.in/tool/${tool.slug}`,
    applicationCategory: "DesignApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    featureList: tool.features,
    author: {
      "@type": "Person",
      name: "Tanish Mittal",
      url: "https://tanishmittal.com"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://tsarr.in" },
      { "@type": "ListItem", position: 2, name: "Tools", item: "https://tsarr.in/tools" },
      { "@type": "ListItem", position: 3, name: tool.title, item: `https://tsarr.in/tool/${tool.slug}` }
    ]
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to use ${tool.title}`,
    description: tool.description,
    step: [
      { "@type": "HowToStep", name: "Open the tool", text: `Go to tsarr.in and open ${tool.title}` },
      { "@type": "HowToStep", name: "Upload or create", text: "Upload your file or start creating" },
      { "@type": "HowToStep", name: "Customize", text: "Use the available options to customize your output" },
      { "@type": "HowToStep", name: "Export", text: "Download your finished work in your preferred format" }
    ]
  };

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{tool.title} - Free Online Tool | tsarr.in</title>
        <meta name="title" content={`${tool.title} - Free Online Tool | tsarr.in`} />
        <meta name="description" content={tool.metaDescription} />
        <meta name="keywords" content={tool.keywords.join(", ")} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Tanish Mittal" />
        <link rel="canonical" href={`https://tsarr.in/tool/${tool.slug}`} />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://tsarr.in/tool/${tool.slug}`} />
        <meta property="og:title" content={`${tool.title} - Free Online Tool | tsarr.in`} />
        <meta property="og:description" content={tool.metaDescription} />
        <meta property="og:image" content="https://tsarr.in/images/og-image.png" />
        <meta property="og:site_name" content="tsarr.in" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`https://tsarr.in/tool/${tool.slug}`} />
        <meta name="twitter:title" content={`${tool.title} - Free Online Tool | tsarr.in`} />
        <meta name="twitter:description" content={tool.metaDescription} />
        <meta name="twitter:image" content="https://tsarr.in/images/og-image.png" />
        <meta name="twitter:creator" content="@mittaltani36318" />

        {/* Structured Data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
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
              <Link href={tool.href} className="ml-3 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                Open Tool
              </Link>
            </nav>
          </div>
        </header>

        <main>
          {/* Breadcrumb & Hero */}
          <section className="pt-12 pb-10 px-6 border-b border-gray-100">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
                <span>/</span>
                <Link href="/tools" className="hover:text-gray-700 transition-colors">Tools</Link>
                <span>/</span>
                <span className="text-gray-900">{tool.title}</span>
              </div>
              
              <div className="max-w-3xl">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded mb-4 inline-block">
                  {tool.category}
                </span>
                <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight mb-4 leading-tight">
                  {tool.title}
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  {tool.description}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href={tool.href} className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                    Open {tool.title}
                    <BsArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/tools" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                    <BsArrowLeft className="w-4 h-4" />
                    All Tools
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="py-16 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-6">
                    Features
                  </h2>
                  <ul className="space-y-4">
                    {tool.features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <BsCheck className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <span className="text-gray-700 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-6">
                    About this tool
                  </h2>
                  <div className="prose prose-gray">
                    <p className="text-gray-600 leading-relaxed">{tool.longDescription}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Use Cases */}
          <section className="py-16 px-6 bg-gray-50 border-y border-gray-100">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-8">
                Perfect for
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tool.useCases.map((useCase: string, i: number) => (
                  <div key={i} className="p-5 rounded-xl border border-gray-200 bg-white">
                    <p className="text-gray-700">{useCase}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Related Tools */}
          {relatedTools.length > 0 && (
            <section className="py-16 px-6">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-8">
                  Related tools
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {relatedTools.map((relTool, i) => (
                    <Link
                      key={i}
                      href={`/tool/${relTool.slug}`}
                      className="group p-5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-gray-700">
                        {relTool.title}
                      </h3>
                      <p className="text-sm text-gray-500">{relTool.shortDesc}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="py-20 px-6 bg-gray-900 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-semibold tracking-tight mb-4">
                Ready to try {tool.title}?
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Free to use, no login required. Start creating in seconds.
              </p>
              <Link href={tool.href} className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors">
                Open {tool.title}
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
                <a href="https://tanishmittal.com/" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-gray-900">
                  Tanish Mittal
                </a>
              </p>
              <div className="flex items-center gap-4">
                <a href="https://github.com/tansihmittal/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                  <BsGithub className="w-5 h-5" />
                </a>
                <a href="https://x.com/glowdopera" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                  <BsTwitter className="w-5 h-5" />
                </a>
                <a href="https://linkedin.com/in/tanishmittal02" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
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

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = toolsData.map((tool: ToolData) => ({
    params: { slug: tool.slug },
  }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const tool = toolsData.find((t: ToolData) => t.slug === slug);
  
  if (!tool) {
    return { notFound: true };
  }

  const relatedTools = toolsData
    .filter((t: ToolData) => t.category === tool.category && t.slug !== tool.slug)
    .slice(0, 4);

  return {
    props: { tool, relatedTools },
  };
};
