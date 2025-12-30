import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import {
  BsImage, BsArrowRight, BsCode, BsGithub, BsTwitter, BsLinkedin,
  BsType, BsCameraVideo, BsAspectRatio, BsArrowsFullscreen, BsArrowRepeat,
  BsClipboard, BsBarChartFill, BsGlobe, BsPencilSquare, BsChatSquare,
  BsCardImage, BsEraserFill, BsChevronDown, BsSoundwave, BsLayers,
  BsPalette, BsDownload, BsPencil, BsPlay,
} from "react-icons/bs";
import { MdSubtitles } from "react-icons/md";
import { RiSlideshow3Line } from "react-icons/ri";
import { useState } from "react";

// Structured Data for SEO
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "tsarr.in",
  url: "https://tsarr.in",
  description: "Free online screenshot editor with 19+ image and video tools. No login required.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://tsarr.in/tools?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const applicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "tsarr.in Screenshot Editor",
  url: "https://tsarr.in",
  description: "Free online screenshot editor with frames, backgrounds, annotations. Create code screenshots, video captions, and more.",
  applicationCategory: "DesignApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD"
  },
  featureList: [
    "Screenshot frames (macOS, Windows, Browser)",
    "Custom backgrounds and gradients",
    "Annotations and shapes",
    "Code syntax highlighting",
    "Video captions with auto-transcription",
    "Image format conversion",
    "No login required",
    "Free unlimited exports"
  ],
  screenshot: "https://tsarr.in/images/og-image.png",
  author: {
    "@type": "Person",
    name: "Tanish Mittal",
    url: "https://tanishmittal.com"
  }
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "tsarr.in",
  url: "https://tsarr.in",
  logo: "https://tsarr.in/favicon.ico",
  sameAs: [
    "https://twitter.com/mittaltani36318",
    "https://github.com/tansihmittal",
    "https://linkedin.com/in/tanishmittal02"
  ]
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is tsarr.in free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, tsarr.in is completely free with no login required. Create unlimited exports without any cost or restrictions."
      }
    },
    {
      "@type": "Question",
      name: "What export formats are supported?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PNG, JPEG, SVG, WebP, AVIF, GIF, BMP, and ICO. Export at up to 4x resolution for high-quality output."
      }
    },
    {
      "@type": "Question",
      name: "Do I need to create an account?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No account needed. All tools work instantly in your browser with no signup or login required."
      }
    },
    {
      "@type": "Question",
      name: "Can I use exports for commercial projects?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. Everything you create is yours to use for any purpose, including commercial projects."
      }
    }
  ]
};

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const tools = [
    { title: "Screenshot Editor", desc: "Frames, backgrounds, annotations", href: "/editor", icon: <BsImage /> },
    { title: "Code Screenshots", desc: "Syntax highlighting, 20+ themes", href: "/code", icon: <BsCode /> },
    { title: "Text Behind Image", desc: "AI background removal", href: "/text-behind-image", icon: <BsType /> },
    { title: "Video Captions", desc: "Auto-transcription, subtitles", href: "/captions", icon: <MdSubtitles /> },
    { title: "Tweet Editor", desc: "Tweet screenshots", href: "/tweet", icon: <BsTwitter /> },
    { title: "Carousel Editor", desc: "Multi-slide carousels", href: "/carousel", icon: <RiSlideshow3Line /> },
    { title: "Aspect Ratio", desc: "Convert aspect ratios", href: "/aspect-ratio", icon: <BsAspectRatio /> },
    { title: "Image Resizer", desc: "Resize by dimensions", href: "/resize", icon: <BsArrowsFullscreen /> },
    { title: "Image Converter", desc: "PNG, JPG, WebP, AVIF", href: "/convert", icon: <BsArrowRepeat /> },
    { title: "Clipboard Saver", desc: "Paste and download", href: "/clipboard", icon: <BsClipboard /> },
    { title: "Video Converter", desc: "MP4, WebM, GIF", href: "/video-convert", icon: <BsCameraVideo /> },
    { title: "Chart Maker", desc: "Bar, line, pie charts", href: "/chart", icon: <BsBarChartFill /> },
    { title: "Map Maker", desc: "Choropleth, bubble maps", href: "/map", icon: <BsGlobe /> },
    { title: "3D Globe", desc: "Globe visualizations", href: "/globe", icon: <BsGlobe /> },
    { title: "Polaroid Generator", desc: "Vintage photo effects", href: "/polaroid", icon: <BsCardImage /> },
    { title: "Watermark Remover", desc: "AI inpainting", href: "/watermark-remover", icon: <BsEraserFill /> },
    { title: "Text to Speech", desc: "Kokoro, KittenTTS", href: "/tts", icon: <BsSoundwave /> },
    { title: "Image Text Editor", desc: "OCR text editing", href: "/image-text-editor", icon: <BsPencilSquare /> },
    { title: "Bubble Blaster", desc: "Remove speech bubbles", href: "/bubble-blaster", icon: <BsChatSquare /> },
  ];

  const features = [
    { icon: <BsLayers className="w-5 h-5" />, title: "Professional Frames", desc: "macOS, Windows, and browser frames that make screenshots look polished and presentable." },
    { icon: <BsPalette className="w-5 h-5" />, title: "Custom Backgrounds", desc: "Solid colors, gradients, or custom images. Make your screenshots stand out." },
    { icon: <BsCode className="w-5 h-5" />, title: "Code Highlighting", desc: "20+ syntax themes for beautiful code screenshots. Support for all major languages." },
    { icon: <BsPencil className="w-5 h-5" />, title: "Annotations", desc: "Arrows, shapes, text, blur, and highlights. Communicate clearly with visual markup." },
    { icon: <BsDownload className="w-5 h-5" />, title: "Flexible Export", desc: "PNG, SVG, JPEG, WebP at up to 4x resolution. Perfect for any use case." },
    { icon: <BsPlay className="w-5 h-5" />, title: "Video Tools", desc: "Add captions, convert formats, and more. Complete video editing in your browser." },
  ];

  const faqs = [
    { q: "Is tsarr.in free to use?", a: "Yes, completely free with no login required. Create unlimited exports without any cost or restrictions." },
    { q: "What export formats are supported?", a: "PNG, JPEG, SVG, WebP, AVIF, GIF, BMP, and ICO. Export at up to 4x resolution for high-quality output." },
    { q: "Do I need to create an account?", a: "No account needed. All tools work instantly in your browser with no signup or login required." },
    { q: "Can I use exports for commercial projects?", a: "Absolutely. Everything you create is yours to use for any purpose, including commercial projects." },
  ];

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>tsarr.in - Free Screenshot Editor | 19+ Image and Video Tools Online</title>
        <meta name="title" content="tsarr.in - Free Screenshot Editor | 19+ Image and Video Tools Online" />
        <meta name="description" content="Free online screenshot editor with beautiful frames, backgrounds, and annotations. Create code screenshots, add video captions, convert images. 19+ tools, no login required. Export to PNG, SVG, JPEG, WebP." />
        <meta name="keywords" content="screenshot editor, code screenshot, screenshot tool, image editor, free online editor, no login, code to image, beautiful screenshots, video captions, image converter, text behind image" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="author" content="Tanish Mittal" />
        <link rel="canonical" href="https://tsarr.in" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tsarr.in" />
        <meta property="og:title" content="tsarr.in - Free Screenshot Editor | 19+ Image and Video Tools" />
        <meta property="og:description" content="Free online screenshot editor with frames, backgrounds, annotations. Create code screenshots, video captions, and more. No login required." />
        <meta property="og:image" content="https://tsarr.in/images/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="tsarr.in" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://tsarr.in" />
        <meta name="twitter:title" content="tsarr.in - Free Screenshot Editor | 19+ Tools" />
        <meta name="twitter:description" content="Free screenshot editor with frames, backgrounds, annotations. Code screenshots, video captions, image conversion. No login required." />
        <meta name="twitter:image" content="https://tsarr.in/images/og-image.png" />
        <meta name="twitter:creator" content="@mittaltani36318" />
        <meta name="twitter:site" content="@mittaltani36318" />

        {/* Additional SEO */}
        <meta name="theme-color" content="#111827" />
        <meta name="apple-mobile-web-app-title" content="tsarr.in" />
        <meta name="application-name" content="tsarr.in" />
        <meta name="format-detection" content="telephone=no" />

        {/* Structured Data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
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
              <Link href="/blog" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Blog
              </Link>
              <Link href="/editor" className="ml-3 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                Open Editor
              </Link>
            </nav>
          </div>
        </header>

        <main>
          {/* Hero */}
          <section className="pt-20 pb-16 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full mb-6 border border-emerald-100">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  Free and No Login Required
                </div>
                <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight leading-[1.1] mb-6">
                  Screenshot editor for<br />
                  <span className="text-gray-400">modern creators</span>
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl">
                  Transform screenshots into polished visuals. Add frames, backgrounds, 
                  and annotations. Create code screenshots, video captions, and more.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/editor" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                    Open Screenshot Editor
                    <BsArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/code" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                    Code Screenshots
                  </Link>
                  <Link href="/tools" className="inline-flex items-center gap-2 px-4 py-2.5 text-gray-500 text-sm font-medium hover:text-gray-900 transition-colors">
                    View all 19 tools
                    <BsArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Preview */}
          <section className="pb-24 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="relative rounded-xl border border-gray-200 overflow-hidden shadow-2xl shadow-gray-200/60">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-gray-400 font-medium">tsarr.in/editor</span>
                  </div>
                </div>
                <Image src="/images/main.webp" alt="Screenshot Editor Interface" width={1200} height={675} className="w-full h-auto" priority />
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="py-24 px-6 bg-gray-50 border-y border-gray-100">
            <div className="max-w-6xl mx-auto">
              <div className="max-w-2xl mb-16">
                <h2 className="text-3xl font-semibold text-gray-900 tracking-tight mb-4">
                  Everything you need to create stunning visuals
                </h2>
                <p className="text-gray-600 text-lg">
                  Professional-grade tools that help you communicate better through images.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, i) => (
                  <div key={i} className="group">
                    <div className="w-10 h-10 flex items-center justify-center bg-white text-gray-700 rounded-lg border border-gray-200 mb-4 group-hover:border-gray-300 group-hover:shadow-sm transition-all">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Tools */}
          <section className="py-24 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">
                    19+ creative tools
                  </h2>
                  <p className="text-gray-600">All free, all in your browser.</p>
                </div>
                <Link href="/tools" className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors hidden sm:flex items-center gap-1">
                  View all <BsArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tools.slice(0, 12).map((tool, i) => (
                  <Link
                    key={i}
                    href={tool.href}
                    className="group flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
                  >
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg group-hover:bg-gray-200 transition-colors flex-shrink-0">
                      {tool.icon}
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <div className="font-medium text-gray-900 mb-0.5">{tool.title}</div>
                      <div className="text-sm text-gray-500">{tool.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link href="/tools" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                  View all 19 tools
                  <BsArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="py-24 px-6 bg-gray-900 text-white">
            <div className="max-w-6xl mx-auto">
              <div className="max-w-2xl mb-16">
                <h2 className="text-3xl font-semibold tracking-tight mb-4">
                  Simple workflow, powerful results
                </h2>
                <p className="text-gray-400 text-lg">
                  Get from screenshot to polished visual in seconds.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { n: "01", t: "Upload", d: "Drop an image, paste from clipboard, or select a file. We support all common formats." },
                  { n: "02", t: "Customize", d: "Add frames, backgrounds, annotations. Adjust padding, shadows, and more." },
                  { n: "03", t: "Export", d: "Download as PNG, SVG, JPEG, or WebP at up to 4x resolution." },
                ].map((step, i) => (
                  <div key={i} className="relative">
                    <div className="text-5xl font-bold text-gray-800 mb-4">{step.n}</div>
                    <h3 className="text-xl font-semibold mb-2">{step.t}</h3>
                    <p className="text-gray-400 leading-relaxed">{step.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-24 px-6">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-semibold text-gray-900 tracking-tight mb-4">
                  Frequently asked questions
                </h2>
                <p className="text-gray-600">
                  Everything you need to know about tsarr.in
                </p>
              </div>
              <div className="divide-y divide-gray-200 border-y border-gray-200">
                {faqs.map((faq, i) => (
                  <div key={i}>
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full py-5 text-left flex items-center justify-between gap-4 hover:text-gray-600 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{faq.q}</span>
                      <BsChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-200 ${openFaq === i ? "max-h-40 pb-5" : "max-h-0"}`}>
                      <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-24 px-6 bg-gray-50 border-t border-gray-100">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-semibold text-gray-900 tracking-tight mb-4">
                Ready to create something amazing?
              </h2>
              <p className="text-gray-600 text-lg mb-8">
                No signup required. Start editing in seconds.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/editor" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                  Open Screenshot Editor
                  <BsArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/tools" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                  Browse All Tools
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row items-start justify-between gap-8">
              <div>
                <Link href="/" className="text-lg font-semibold text-gray-900 tracking-tight">
                  tsarr.in
                </Link>
                <p className="mt-2 text-sm text-gray-500 max-w-xs">
                  Free screenshot editor and image tools. No login required.
                </p>
              </div>
              <div className="flex gap-12">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Tools</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li><Link href="/editor" className="hover:text-gray-900 transition-colors">Screenshot Editor</Link></li>
                    <li><Link href="/code" className="hover:text-gray-900 transition-colors">Code Screenshots</Link></li>
                    <li><Link href="/captions" className="hover:text-gray-900 transition-colors">Video Captions</Link></li>
                    <li><Link href="/tools" className="hover:text-gray-900 transition-colors">All Tools</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Resources</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li><Link href="/blog" className="hover:text-gray-900 transition-colors">Blog</Link></li>
                    <li><a href="https://github.com/tansihmittal/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">GitHub</a></li>
                    <li><a href="https://x.com/glowdopera" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">Twitter</a></li>
                    <li><a href="https://linkedin.com/in/tanishmittal02" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">LinkedIn</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
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
