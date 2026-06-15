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
import { useState, useEffect } from "react";
import { Project, cacheProjects, getRecentProjects } from "../utils/projectStorage";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardTitle, CardDescription } from "../components/ui/card";

const typeRoutes: Record<string, string> = {
  screenshot: "/editor",
  code: "/code",
  tweet: "/tweet",
  carousel: "/carousel",
  polaroid: "/polaroid",
  "text-behind-image": "/text-behind-image",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "tsarr.in",
  url: "https://tsarr.in",
  description: "Free online screenshot editor with 19+ image and video tools. No login required.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://tsarr.in/tools?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const applicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "tsarr.in Screenshot Editor",
  url: "https://tsarr.in",
  description: "Free online screenshot editor with frames, backgrounds, annotations.",
  applicationCategory: "DesignApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Screenshot frames (macOS, Windows, Browser)",
    "Custom backgrounds and gradients",
    "Annotations and shapes",
    "Code syntax highlighting",
    "Video captions with auto-transcription",
    "Image format conversion",
    "No login required",
    "Free unlimited exports",
  ],
  screenshot: "https://tsarr.in/images/og-image.png",
  author: { "@type": "Person", name: "Tanish Mittal", url: "https://tanishmittal.com" },
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
    "https://linkedin.com/in/tanishmittal02",
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Is tsarr.in free to use?", acceptedAnswer: { "@type": "Answer", text: "Yes, completely free with no login required." } },
    { "@type": "Question", name: "What export formats are supported?", acceptedAnswer: { "@type": "Answer", text: "PNG, JPEG, SVG, WebP, AVIF, GIF, BMP, and ICO. Up to 4x resolution." } },
    { "@type": "Question", name: "Do I need to create an account?", acceptedAnswer: { "@type": "Answer", text: "No account needed. All tools work instantly in your browser." } },
    { "@type": "Question", name: "Can I use exports for commercial projects?", acceptedAnswer: { "@type": "Answer", text: "Absolutely. Everything you create is yours to use for any purpose." } },
  ],
};

const FONT = "'IBM Plex Sans', sans-serif";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);

  useEffect(() => {
    const loadRecent = async () => {
      await cacheProjects();
      setRecentProjects(getRecentProjects());
    };
    loadRecent();
  }, []);

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

  const quickLinks = ["Code Screenshots", "Video Captions", "Text Behind Image", "AI Watermark Removal", "Image Converter"];

  return (
    <>
      <Head>
        <title>tsarr.in - Free Screenshot Editor | 19+ Image and Video Tools Online</title>
        <meta name="description" content="Free online screenshot editor with beautiful frames, backgrounds, and annotations. Create code screenshots, add video captions, convert images. 19+ tools, no login required." />
        <meta name="keywords" content="screenshot editor, code screenshot, screenshot tool, image editor, free online editor, no login, code to image, beautiful screenshots, video captions, image converter" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="author" content="Tanish Mittal" />
        <link rel="canonical" href="https://tsarr.in" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tsarr.in" />
        <meta property="og:title" content="tsarr.in - Free Screenshot Editor | 19+ Image and Video Tools" />
        <meta property="og:description" content="Free online screenshot editor with frames, backgrounds, annotations. No login required." />
        <meta property="og:image" content="https://tsarr.in/images/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="tsarr.in" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="tsarr.in - Free Screenshot Editor | 19+ Tools" />
        <meta name="twitter:description" content="Free screenshot editor with frames, backgrounds, annotations. No login required." />
        <meta name="twitter:image" content="https://tsarr.in/images/og-image.png" />
        <meta name="twitter:creator" content="@mittaltani36318" />
        <meta name="theme-color" content="#ffffff" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </Head>

      <div className="min-h-screen bg-white text-[#0A0A0A] antialiased" style={{ fontFamily: FONT }}>

        {/* ── Header ── */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-[#E5E7EB]">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-base font-semibold text-[#0A0A0A] tracking-tight">
              tsarr.in
            </Link>

            {/* Pill nav group */}
            <nav className="hidden md:flex items-center gap-0.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full px-1.5 py-1">
              {[
                { label: "Tools", href: "/tools" },
                { label: "Blog", href: "/blog" },
                { label: "Projects", href: "/projects" },
              ].map(({ label, href }) => (
                <Button key={label} variant="ghost" size="sm" asChild>
                  <Link href={href}>{label}</Link>
                </Button>
              ))}
            </nav>

            <Button size="sm" asChild>
              <Link href="/editor">Open Editor</Link>
            </Button>
          </div>
        </header>

        <main>
          {/* ── Hero ── */}
          <section
            className="pt-24 pb-20 px-6 relative overflow-hidden"
            style={{
              background:
                "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(37,99,235,0.11) 0%, transparent 65%), #ffffff",
            }}
          >
            <div className="max-w-6xl mx-auto text-center relative">
              {/* Badge */}
              <Badge variant="primary" className="mb-8">
                <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full" />
                Free · No login · 19+ tools
              </Badge>

              {/* Headline */}
              <h1
                className="font-normal text-[#0A0A0A] mb-6 max-w-4xl mx-auto"
                style={{
                  fontSize: "clamp(40px,6vw,64px)",
                  lineHeight: 1,
                  letterSpacing: "-3px",
                }}
              >
                Screenshot editor for{" "}
                <span className="text-[#2563EB]">modern creators</span>
              </h1>

              {/* Subheadline */}
              <p
                className="text-[#4B5563] mb-10 max-w-lg mx-auto"
                style={{ fontSize: 18, lineHeight: "28px" }}
              >
                Frames, backgrounds, annotations, and AI tools — all free in your browser.
              </p>

              {/* CTA row */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
                <Button asChild>
                  <Link href="/editor">
                    Open Screenshot Editor
                    <BsArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/tools">Browse All Tools</Link>
                </Button>
              </div>

              {/* Quick-link chips */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {quickLinks.map((label) => (
                  <Badge key={label}>{label}</Badge>
                ))}
              </div>
            </div>
          </section>

          {/* ── App preview ── */}
          <section className="pb-24 px-6">
            <div className="max-w-6xl mx-auto">
              <div
                className="rounded-[20px] border border-[#E5E7EB] overflow-hidden"
                style={{
                  boxShadow:
                    "0 24px 64px -12px rgba(0,0,0,0.10), 0 4px 16px -4px rgba(37,99,235,0.06)",
                }}
              >
                <div className="flex items-center gap-3 px-5 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-3 h-3 rounded-full bg-[#E5E7EB]" />
                    ))}
                  </div>
                  <div className="flex-1 flex justify-center">
                    <span className="bg-white border border-[#E5E7EB] rounded-full px-4 py-1 text-[#4B5563] text-xs font-medium">
                      tsarr.in/editor
                    </span>
                  </div>
                </div>
                <Image
                  src="/images/main.webp"
                  alt="tsarr.in Screenshot Editor"
                  width={1200}
                  height={675}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </section>

          {/* ── Recent Projects ── */}
          {recentProjects.length > 0 && (
            <section className="pb-20 px-6">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-medium text-[#0A0A0A]" style={{ fontSize: 20 }}>
                    Continue where you left off
                  </h2>
                  <Button variant="link" size="sm" asChild>
                    <Link href="/projects">
                      All projects <BsArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {recentProjects.slice(0, 5).map((project) => (
                    <Link
                      key={project.id}
                      href={`${typeRoutes[project.type]}?project=${project.id}`}
                      className="block"
                    >
                      <Card className="overflow-hidden hover:border-[#60A5FA]">
                        <div className="aspect-[4/3] bg-[#F3F4F6] relative overflow-hidden">
                          {project.thumbnail ? (
                            <img
                              src={project.thumbnail}
                              alt={project.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BsImage className="text-2xl text-[#E5E7EB]" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <p className="font-medium text-[#0A0A0A] truncate text-sm">{project.name}</p>
                          <p className="text-[#4B5563] mt-0.5 text-xs">
                            {new Date(project.updatedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Features ── */}
          <section className="py-24 px-6 bg-[#F9FAFB] border-y border-[#E5E7EB]">
            <div className="max-w-6xl mx-auto">
              <div className="max-w-xl mb-16">
                <h2
                  className="font-normal text-[#0A0A0A] mb-4"
                  style={{ fontSize: "clamp(28px,3.5vw,40px)", lineHeight: 1.1, letterSpacing: "-1.5px" }}
                >
                  Everything you need to create stunning visuals
                </h2>
                <p className="text-[#4B5563]" style={{ fontSize: 18, lineHeight: "28px" }}>
                  Professional-grade tools that help you communicate better through images.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {features.map((feature, i) => (
                  <Card key={i} className="bg-white hover:border-[#60A5FA] hover:shadow-sm">
                    <CardContent className="p-6">
                      <div className="w-10 h-10 flex items-center justify-center bg-[#EFF6FF] text-[#2563EB] rounded-[10px] mb-4">
                        {feature.icon}
                      </div>
                      <CardTitle className="mb-2">{feature.title}</CardTitle>
                      <CardDescription>{feature.desc}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* ── Tools grid ── */}
          <section className="py-24 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <h2
                    className="font-normal text-[#0A0A0A] mb-2"
                    style={{ fontSize: "clamp(28px,3.5vw,40px)", lineHeight: 1.1, letterSpacing: "-1.5px" }}
                  >
                    19+ creative tools
                  </h2>
                  <p className="text-[#4B5563]" style={{ fontSize: 16 }}>
                    All free, all in your browser.
                  </p>
                </div>
                <Button variant="link" size="sm" asChild className="hidden sm:flex">
                  <Link href="/tools">
                    View all <BsArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {tools.slice(0, 12).map((tool, i) => (
                  <Link key={i} href={tool.href} className="block">
                    <Card className="group flex items-start gap-4 p-4 hover:border-[#DBEAFE] hover:bg-[#EFF6FF]">
                      <div className="w-9 h-9 flex items-center justify-center bg-white text-[#2563EB] rounded-[10px] border border-[#E5E7EB] group-hover:border-[#60A5FA] transition-colors flex-shrink-0">
                        {tool.icon}
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="font-medium text-[#0A0A0A] text-sm mb-0.5">{tool.title}</p>
                        <p className="text-[#4B5563] text-xs">{tool.desc}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Button variant="secondary" asChild>
                  <Link href="/tools">
                    View all 19 tools
                    <BsArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* ── How it works ── */}
          <section className="py-24 px-6 bg-[#F9FAFB] border-y border-[#E5E7EB]">
            <div className="max-w-6xl mx-auto">
              <div className="max-w-xl mb-16">
                <h2
                  className="font-normal text-[#0A0A0A] mb-4"
                  style={{ fontSize: "clamp(28px,3.5vw,40px)", lineHeight: 1.1, letterSpacing: "-1.5px" }}
                >
                  Simple workflow, powerful results
                </h2>
                <p className="text-[#4B5563]" style={{ fontSize: 18, lineHeight: "28px" }}>
                  Get from screenshot to polished visual in seconds.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {[
                  { n: "01", t: "Upload", d: "Drop an image, paste from clipboard, or select a file. We support all common formats." },
                  { n: "02", t: "Customize", d: "Add frames, backgrounds, annotations. Adjust padding, shadows, and more." },
                  { n: "03", t: "Export", d: "Download as PNG, SVG, JPEG, or WebP at up to 4x resolution." },
                ].map((step, i) => (
                  <div key={i}>
                    <div
                      className="font-normal text-[#DBEAFE] mb-4"
                      style={{ fontSize: 56, lineHeight: 1, letterSpacing: "-2px" }}
                    >
                      {step.n}
                    </div>
                    <h3 className="font-medium text-[#0A0A0A] mb-2" style={{ fontSize: 20 }}>
                      {step.t}
                    </h3>
                    <p className="text-[#4B5563]" style={{ fontSize: 16, lineHeight: "26px" }}>
                      {step.d}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section className="py-24 px-6">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2
                  className="font-normal text-[#0A0A0A] mb-4"
                  style={{ fontSize: "clamp(28px,3.5vw,40px)", lineHeight: 1.1, letterSpacing: "-1.5px" }}
                >
                  Frequently asked questions
                </h2>
                <p className="text-[#4B5563]" style={{ fontSize: 16 }}>
                  Everything you need to know about tsarr.in
                </p>
              </div>
              <div className="border border-[#E5E7EB] rounded-[20px] overflow-hidden divide-y divide-[#E5E7EB]">
                {faqs.map((faq, i) => (
                  <div key={i}>
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-[#F9FAFB] transition-colors"
                    >
                      <span className="font-medium text-[#0A0A0A]" style={{ fontSize: 15 }}>
                        {faq.q}
                      </span>
                      <BsChevronDown
                        className={`w-4 h-4 text-[#4B5563] flex-shrink-0 transition-transform duration-200 ${
                          openFaq === i ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-200 ${
                        openFaq === i ? "max-h-40" : "max-h-0"
                      }`}
                    >
                      <p className="px-6 pb-5 text-[#4B5563]" style={{ fontSize: 15, lineHeight: "24px" }}>
                        {faq.a}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section
            className="py-24 px-6"
            style={{
              background:
                "linear-gradient(145deg, #EFF6FF 0%, #DBEAFE 60%, #EFF6FF 100%)",
            }}
          >
            <div className="max-w-3xl mx-auto text-center">
              <h2
                className="font-normal text-[#0A0A0A] mb-4"
                style={{ fontSize: "clamp(32px,4vw,48px)", lineHeight: 1.05, letterSpacing: "-2px" }}
              >
                Ready to create something amazing?
              </h2>
              <p className="text-[#4B5563] mb-10" style={{ fontSize: 18, lineHeight: "28px" }}>
                No signup required. Start editing in seconds.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button asChild>
                  <Link href="/editor">
                    Open Screenshot Editor
                    <BsArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/tools">Browse All Tools</Link>
                </Button>
              </div>
            </div>
          </section>
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-[#E5E7EB] bg-white">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row items-start justify-between gap-8">
              <div>
                <Link href="/" className="font-semibold text-[#0A0A0A]" style={{ fontSize: 16 }}>
                  tsarr.in
                </Link>
                <p className="mt-2 text-[#4B5563] max-w-xs" style={{ fontSize: 14 }}>
                  Free screenshot editor and image tools. No login required.
                </p>
              </div>
              <div className="flex gap-12">
                <div>
                  <h4 className="font-medium text-[#0A0A0A] mb-3" style={{ fontSize: 14 }}>
                    Tools
                  </h4>
                  <ul className="space-y-2">
                    {[
                      { label: "Screenshot Editor", href: "/editor" },
                      { label: "Code Screenshots", href: "/code" },
                      { label: "Video Captions", href: "/captions" },
                      { label: "All Tools", href: "/tools" },
                    ].map(({ label, href }) => (
                      <li key={label}>
                        <Link
                          href={href}
                          className="text-[#4B5563] hover:text-[#0A0A0A] transition-colors"
                          style={{ fontSize: 14 }}
                        >
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-[#0A0A0A] mb-3" style={{ fontSize: 14 }}>
                    Resources
                  </h4>
                  <ul className="space-y-2">
                    <li>
                      <Link href="/blog" className="text-[#4B5563] hover:text-[#0A0A0A] transition-colors" style={{ fontSize: 14 }}>
                        Blog
                      </Link>
                    </li>
                    <li>
                      <a href="https://github.com/tansihmittal/" target="_blank" rel="noopener noreferrer" className="text-[#4B5563] hover:text-[#0A0A0A] transition-colors" style={{ fontSize: 14 }}>
                        GitHub
                      </a>
                    </li>
                    <li>
                      <a href="https://x.com/glowdopera" target="_blank" rel="noopener noreferrer" className="text-[#4B5563] hover:text-[#0A0A0A] transition-colors" style={{ fontSize: 14 }}>
                        Twitter
                      </a>
                    </li>
                    <li>
                      <a href="https://linkedin.com/in/tanishmittal02" target="_blank" rel="noopener noreferrer" className="text-[#4B5563] hover:text-[#0A0A0A] transition-colors" style={{ fontSize: 14 }}>
                        LinkedIn
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-[#F3F4F6] flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[#4B5563]" style={{ fontSize: 14 }}>
                © 2025 tsarr.in. Created by{" "}
                <a
                  href="https://tanishmittal.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0A0A0A] hover:text-[#2563EB] transition-colors"
                >
                  Tanish Mittal
                </a>
              </p>
              <div className="flex items-center gap-4">
                {[
                  { href: "https://github.com/tansihmittal/", icon: <BsGithub className="w-5 h-5" /> },
                  { href: "https://x.com/glowdopera", icon: <BsTwitter className="w-5 h-5" /> },
                  { href: "https://linkedin.com/in/tanishmittal02", icon: <BsLinkedin className="w-5 h-5" /> },
                ].map(({ href, icon }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4B5563] hover:text-[#0A0A0A] transition-colors"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
