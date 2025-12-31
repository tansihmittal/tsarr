import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { BsArrowRight, BsGithub, BsTwitter, BsLinkedin, BsCheck, BsArrowLeft, BsChevronDown, BsFolder2, BsLightning, BsShield, BsGlobe } from "react-icons/bs";
import { toolsData, ToolData } from "@/data/toolsData";

interface ToolPageProps {
  tool: ToolData;
  relatedTools: ToolData[];
}

// Generate FAQ items based on tool data
const generateFAQs = (tool: ToolData) => [
  {
    q: `Is ${tool.title} free to use?`,
    a: `Yes, ${tool.title} is completely free with no hidden costs. You can use all features without creating an account or providing payment information.`
  },
  {
    q: `Do I need to create an account to use ${tool.title}?`,
    a: `No account required. Simply open the tool and start using it immediately. All processing happens in your browser for maximum privacy.`
  },
  {
    q: `What file formats does ${tool.title} support?`,
    a: `${tool.title} supports all common formats including PNG, JPEG, WebP, and more. You can export your work in multiple formats at various quality levels.`
  },
  {
    q: `Is my data safe when using ${tool.title}?`,
    a: `Absolutely. All processing happens locally in your browser. Your files are never uploaded to our servers, ensuring complete privacy and security.`
  },
  {
    q: `Can I use ${tool.title} on mobile devices?`,
    a: `Yes, ${tool.title} works on all modern browsers including mobile devices. The interface is responsive and optimized for touch screens.`
  }
];

export default function ToolPage({ tool, relatedTools }: ToolPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqs = generateFAQs(tool);

  // Structured Data
  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.title,
    description: tool.longDescription,
    url: `https://tsarr.in/tool/${tool.slug}`,
    applicationCategory: "DesignApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    featureList: tool.features,
    screenshot: "https://tsarr.in/images/og-image.png",
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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a
      }
    }))
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to use ${tool.title}`,
    description: tool.description,
    totalTime: "PT2M",
    step: [
      { "@type": "HowToStep", position: 1, name: "Open the tool", text: `Navigate to tsarr.in and open ${tool.title} from the tools menu.` },
      { "@type": "HowToStep", position: 2, name: "Upload your content", text: "Upload your file by dragging and dropping, pasting from clipboard, or clicking to browse." },
      { "@type": "HowToStep", position: 3, name: "Customize settings", text: "Use the available options to customize your output according to your needs." },
      { "@type": "HowToStep", position: 4, name: "Export your work", text: "Download your finished work in your preferred format and resolution." }
    ]
  };

  return (
    <>
      <Head>
        <title>{tool.title} - Free Online Tool | tsarr.in</title>
        <meta name="title" content={`${tool.title} - Free Online Tool | tsarr.in`} />
        <meta name="description" content={tool.metaDescription} />
        <meta name="keywords" content={tool.keywords.join(", ")} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <meta name="author" content="Tanish Mittal" />
        <link rel="canonical" href={`https://tsarr.in/tool/${tool.slug}`} />
        <link rel="icon" href="/favicon.ico" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://tsarr.in/tool/${tool.slug}`} />
        <meta property="og:title" content={`${tool.title} - Free Online Tool | tsarr.in`} />
        <meta property="og:description" content={tool.metaDescription} />
        <meta property="og:image" content="https://tsarr.in/images/og-image.png" />
        <meta property="og:site_name" content="tsarr.in" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`https://tsarr.in/tool/${tool.slug}`} />
        <meta name="twitter:title" content={`${tool.title} - Free Online Tool`} />
        <meta name="twitter:description" content={tool.metaDescription} />
        <meta name="twitter:image" content="https://tsarr.in/images/og-image.png" />
        <meta name="twitter:creator" content="@glowdopera" />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      </Head>

      <div className="min-h-screen bg-white text-gray-900 antialiased">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold text-gray-900">
              tsarr.in
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/projects" className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100">
                <BsFolder2 />
              </Link>
              <Link href="/tools" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
                Tools
              </Link>
              <Link href={tool.href} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Open Tool
              </Link>
            </nav>
          </div>
        </header>

        <main>
          {/* Hero */}
          <section className="pt-8 pb-12 px-4 sm:px-6 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-6xl mx-auto">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Link href="/" className="hover:text-gray-900">Home</Link>
                <span>/</span>
                <Link href="/tools" className="hover:text-gray-900">Tools</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">{tool.title}</span>
              </nav>
              
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-4">
                  {tool.category}
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                  {tool.title}
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                  {tool.description}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href={tool.href} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                    Open {tool.title}
                    <BsArrowRight />
                  </Link>
                  <Link href="/tools" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                    <BsArrowLeft />
                    All Tools
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Key Benefits */}
          <section className="py-12 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BsLightning className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">100% Free</h3>
                    <p className="text-sm text-gray-600">No hidden costs, no premium tiers. All features available for free.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BsShield className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Privacy First</h3>
                    <p className="text-sm text-gray-600">All processing happens in your browser. Files never leave your device.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BsGlobe className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">No Login Required</h3>
                    <p className="text-sm text-gray-600">Start using immediately. No account, no signup, no hassle.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features & About */}
          <section className="py-12 px-4 sm:px-6 bg-gray-50 border-y border-gray-100">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Features</h2>
                  <ul className="space-y-4">
                    {tool.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <BsCheck className="text-green-600 text-sm" />
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">About {tool.title}</h2>
                  <p className="text-gray-600 leading-relaxed">{tool.longDescription}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Use Cases */}
          <section className="py-12 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Perfect for</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tool.useCases.map((useCase, i) => (
                  <div key={i} className="p-5 rounded-xl border border-gray-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all">
                    <p className="text-gray-700">{useCase}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How to Use */}
          <section className="py-12 px-4 sm:px-6 bg-gray-50 border-y border-gray-100">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">How to use {tool.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { step: "1", title: "Open the tool", desc: "Click the button above to open the tool in your browser." },
                  { step: "2", title: "Upload content", desc: "Drag & drop, paste from clipboard, or click to browse files." },
                  { step: "3", title: "Customize", desc: "Use the available options to adjust settings to your needs." },
                  { step: "4", title: "Export", desc: "Download your work in your preferred format and quality." },
                ].map((item, i) => (
                  <div key={i} className="relative">
                    <div className="text-4xl font-bold text-indigo-100 mb-2">{item.step}</div>
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
              <div className="divide-y divide-gray-200 border-y border-gray-200">
                {faqs.map((faq, i) => (
                  <div key={i}>
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full py-5 text-left flex items-center justify-between gap-4 hover:text-indigo-600 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{faq.q}</span>
                      <BsChevronDown className={`text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-200 ${openFaq === i ? "max-h-40 pb-5" : "max-h-0"}`}>
                      <p className="text-gray-600">{faq.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Related Tools */}
          {relatedTools.length > 0 && (
            <section className="py-12 px-4 sm:px-6 bg-gray-50 border-t border-gray-100">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Related tools</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {relatedTools.map((relTool, i) => (
                    <Link
                      key={i}
                      href={`/tool/${relTool.slug}`}
                      className="group p-5 rounded-xl border border-gray-200 bg-white hover:border-indigo-200 hover:shadow-md transition-all"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
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
          <section className="py-16 px-4 sm:px-6 bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to try {tool.title}?
              </h2>
              <p className="text-indigo-100 text-lg mb-8">
                Free to use, no login required. Start creating in seconds.
              </p>
              <Link href={tool.href} className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
                Open {tool.title}
                <BsArrowRight />
              </Link>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                © 2025 tsarr.in · <a href="https://tanishmittal.com/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">Tanish Mittal</a>
              </p>
              <div className="flex items-center gap-4">
                <a href="https://github.com/tansihmittal/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600"><BsGithub className="w-5 h-5" /></a>
                <a href="https://x.com/glowdopera" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600"><BsTwitter className="w-5 h-5" /></a>
                <a href="https://linkedin.com/in/tanishmittal02" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600"><BsLinkedin className="w-5 h-5" /></a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = toolsData.map((tool) => ({
    params: { slug: tool.slug },
  }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const tool = toolsData.find((t) => t.slug === slug);
  
  if (!tool) {
    return { notFound: true };
  }

  const relatedTools = toolsData
    .filter((t) => t.category === tool.category && t.slug !== tool.slug)
    .slice(0, 4);

  return {
    props: { tool, relatedTools },
  };
};
