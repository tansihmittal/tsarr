import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import {
  BsImage,
  BsDownload,
  BsPalette,
  BsArrowRight,
  BsPencil,
  BsCode,
  BsGithub,
  BsTwitter,
  BsInstagram,
  BsLinkedin,
  BsYoutube,
  BsEnvelope,
  BsCheckCircleFill,
  BsLightningChargeFill,
  BsStars,
  BsType,
  BsCameraVideo,
  BsAspectRatio,
  BsArrowsFullscreen,
  BsArrowRepeat,
  BsClipboard,
  BsBarChartFill,
  BsGlobe,
  BsPencilSquare,
  BsChatSquare,
  BsCardImage,
  BsEraserFill,
  BsQuestionCircle,
  BsChevronDown,
} from "react-icons/bs";
import { MdSubtitles } from "react-icons/md";
import { TbTransform, TbSparkles } from "react-icons/tb";
import { HiOutlinePhotograph, HiCursorClick } from "react-icons/hi";
import { RiSlideshow3Line } from "react-icons/ri";
import { useState } from "react";

// JSON-LD Structured Data
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "tsarr.in - Free Online Screenshot & Image Editor",
  "url": "https://tsarr.in",
  "description": "Free online screenshot editor with frames, backgrounds, annotations. Create beautiful code screenshots, text behind image effects, video captions, and more. No login required.",
  "applicationCategory": "DesignApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "Screenshot Editor with Frames",
    "Code Screenshot Generator",
    "Text Behind Image Effect",
    "Video Caption Editor",
    "Tweet Screenshot Maker",
    "Carousel Creator",
    "Image Converter",
    "Image Resizer",
    "Aspect Ratio Converter",
    "Chart Maker",
    "Map Maker",
    "3D Globe Visualization",
    "Polaroid Generator",
    "Watermark Remover"
  ],
  "author": {
    "@type": "Person",
    "name": "Tanish Mittal",
    "url": "https://tanishmittal.com"
  }
};

const faqData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is tsarr.in free to use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, tsarr.in is completely free to use with no login required. You can create unlimited screenshots, code images, and more without any cost."
      }
    },
    {
      "@type": "Question",
      "name": "What image formats can I export?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can export your creations in PNG, JPEG, SVG, WebP, AVIF, GIF, BMP, and ICO formats at various resolutions."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need to create an account?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No account or login is required. Simply visit the website and start creating beautiful screenshots instantly."
      }
    },
    {
      "@type": "Question",
      "name": "What tools are available on tsarr.in?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "tsarr.in offers 18+ free tools including Screenshot Editor, Code Screenshot Generator, Text Behind Image, Video Captions, Tweet Editor, Carousel Creator, Image Converter, Image Resizer, Aspect Ratio Converter, Chart Maker, Map Maker, 3D Globe, Polaroid Generator, and Watermark Remover."
      }
    }
  ]
};

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      icon: <BsImage className="w-5 h-5" />,
      title: "Flexible Frames",
      description: "macOS, Windows, and browser frame styles for professional screenshots",
    },
    {
      icon: <TbTransform className="w-5 h-5" />,
      title: "Transform Options",
      description: "Tilt, rotate, and position your images with precision controls",
    },
    {
      icon: <BsPalette className="w-5 h-5" />,
      title: "Background Styles",
      description: "Beautiful gradients, solid colors, or custom backgrounds",
    },
    {
      icon: <BsDownload className="w-5 h-5" />,
      title: "Multiple Exports",
      description: "PNG, SVG, JPEG, WebP in various resolutions up to 4x",
    },
    {
      icon: <BsCode className="w-5 h-5" />,
      title: "Code Screenshots",
      description: "Syntax highlighting with 20+ themes for beautiful code images",
    },
    {
      icon: <BsPencil className="w-5 h-5" />,
      title: "Annotations",
      description: "Arrows, shapes, text, blur, and highlights for clear communication",
    },
    {
      icon: <BsType className="w-5 h-5" />,
      title: "Text Behind Image",
      description: "Create stunning text behind image effects with AI background removal",
    },
    {
      icon: <MdSubtitles className="w-5 h-5" />,
      title: "Video Captions",
      description: "Add stylish captions and subtitles to videos with auto-transcription",
    },
  ];

  const allTools = [
    { title: "Screenshot Editor", href: "/editor", icon: <BsImage className="w-5 h-5" />, color: "from-indigo-500 to-purple-600" },
    { title: "Code Editor", href: "/code", icon: <BsCode className="w-5 h-5" />, color: "from-emerald-500 to-teal-600" },
    { title: "Text Behind Image", href: "/text-behind-image", icon: <BsType className="w-5 h-5" />, color: "from-purple-500 to-pink-600" },
    { title: "Video Captions", href: "/captions", icon: <MdSubtitles className="w-5 h-5" />, color: "from-orange-500 to-red-600" },
    { title: "Tweet Editor", href: "/tweet", icon: <BsTwitter className="w-5 h-5" />, color: "from-sky-500 to-blue-600" },
    { title: "Carousel Editor", href: "/carousel", icon: <RiSlideshow3Line className="w-5 h-5" />, color: "from-rose-500 to-pink-600" },
    { title: "Aspect Ratio", href: "/aspect-ratio", icon: <BsAspectRatio className="w-5 h-5" />, color: "from-cyan-500 to-blue-600" },
    { title: "Image Resizer", href: "/resize", icon: <BsArrowsFullscreen className="w-5 h-5" />, color: "from-amber-500 to-orange-600" },
    { title: "Image Converter", href: "/convert", icon: <BsArrowRepeat className="w-5 h-5" />, color: "from-green-500 to-emerald-600" },
    { title: "Clipboard Saver", href: "/clipboard", icon: <BsClipboard className="w-5 h-5" />, color: "from-violet-500 to-purple-600" },
    { title: "Video Converter", href: "/video-convert", icon: <BsCameraVideo className="w-5 h-5" />, color: "from-red-500 to-rose-600" },
    { title: "Chart Maker", href: "/chart", icon: <BsBarChartFill className="w-5 h-5" />, color: "from-teal-500 to-cyan-600" },
    { title: "Map Maker", href: "/map", icon: <BsGlobe className="w-5 h-5" />, color: "from-indigo-500 to-blue-600" },
    { title: "3D Globe", href: "/globe", icon: <BsGlobe className="w-5 h-5" />, color: "from-blue-500 to-indigo-600" },
    { title: "Polaroid Generator", href: "/polaroid", icon: <BsCardImage className="w-5 h-5" />, color: "from-amber-500 to-yellow-600" },
    { title: "Watermark Remover", href: "/watermark-remover", icon: <BsEraserFill className="w-5 h-5" />, color: "from-red-500 to-orange-600" },
  ];

  const faqs = [
    { q: "Is tsarr.in free to use?", a: "Yes, tsarr.in is completely free to use with no login required. You can create unlimited screenshots, code images, and more without any cost." },
    { q: "What image formats can I export?", a: "You can export your creations in PNG, JPEG, SVG, WebP, AVIF, GIF, BMP, and ICO formats at various resolutions up to 4x." },
    { q: "Do I need to create an account?", a: "No account or login is required. Simply visit the website and start creating beautiful screenshots instantly." },
    { q: "What tools are available?", a: "tsarr.in offers 18+ free tools including Screenshot Editor, Code Screenshot Generator, Text Behind Image, Video Captions, Tweet Editor, Carousel Creator, Image Converter, and more." },
    { q: "Can I use it for commercial projects?", a: "Absolutely! All images you create with tsarr.in are yours to use for any purpose, including commercial projects, social media, documentation, and presentations." },
  ];

  const stats = [
    { value: "100%", label: "Free Forever" },
    { value: "0", label: "Login Required" },
    { value: "18+", label: "Free Tools" },
    { value: "∞", label: "Exports" },
  ];

  return (
    <>
      <Head>
        <title>tsarr.in - Free Online Screenshot Editor | Code Screenshots, Image Tools & More</title>
        <meta
          name="description"
          content="Free online screenshot editor with beautiful frames, backgrounds & annotations. Create stunning code screenshots, text behind image effects, video captions, carousels & more. No login required. Export to PNG, SVG, JPEG."
        />
        <meta name="keywords" content="screenshot editor, code screenshot, screenshot tool, image editor, text behind image, video captions, tweet screenshot, carousel maker, image converter, image resizer, free online editor, no login, code to image, beautiful screenshots" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Tanish Mittal" />
        <link rel="canonical" href="https://tsarr.in" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tsarr.in" />
        <meta property="og:title" content="tsarr.in - Free Online Screenshot Editor | 18+ Creative Tools" />
        <meta property="og:description" content="Transform screenshots into stunning visuals. Free code screenshots, text behind image, video captions & more. No login required." />
        <meta property="og:image" content="https://tsarr.in/images/og-image.png" />
        <meta property="og:site_name" content="tsarr.in" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://tsarr.in" />
        <meta name="twitter:title" content="tsarr.in - Free Online Screenshot Editor | 18+ Creative Tools" />
        <meta name="twitter:description" content="Transform screenshots into stunning visuals. Free code screenshots, text behind image, video captions & more. No login required." />
        <meta name="twitter:image" content="https://tsarr.in/images/og-image.png" />
        <meta name="twitter:creator" content="@mittaltani36318" />

        {/* Additional SEO */}
        <meta name="theme-color" content="#4f46e5" />
        <meta name="apple-mobile-web-app-title" content="tsarr.in" />
        <meta name="application-name" content="tsarr.in" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
          <div className="absolute top-40 -left-40 w-[500px] h-[500px] bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
          <div className="absolute bottom-40 left-1/2 w-[500px] h-[500px] bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000" />
        </div>

        {/* Floating Particles */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 left-[10%] w-2 h-2 bg-indigo-400 rounded-full animate-float opacity-60" />
          <div className="absolute top-40 right-[15%] w-1.5 h-1.5 bg-purple-400 rounded-full animate-float-delayed opacity-50" />
          <div className="absolute top-60 left-[25%] w-2.5 h-2.5 bg-indigo-300 rounded-full animate-float opacity-40" />
          <div className="absolute bottom-40 right-[20%] w-2 h-2 bg-purple-300 rounded-full animate-float-delayed opacity-50" />
        </div>

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50">
          <nav className="mx-4 mt-4" aria-label="Main navigation">
            <div className="max-w-6xl mx-auto backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg shadow-indigo-500/5 rounded-2xl px-6 py-3">
              <div className="flex justify-between items-center">
                <Link
                  href="/"
                  className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                  aria-label="tsarr.in - Home"
                >
                  tsarr.in
                </Link>
                <div className="flex items-center gap-2 sm:gap-4">
                  <Link
                    href="/tools"
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100/80 transition-all"
                  >
                    All Tools
                  </Link>
                  <Link
                    href="/code"
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100/80 transition-all"
                  >
                    <BsCode className="w-4 h-4" />
                    Code Editor
                  </Link>
                  <Link
                    href="/editor"
                    className="group relative bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5 overflow-hidden"
                  >
                    <span className="relative z-10">Open Editor</span>
                  </Link>
                </div>
              </div>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <main>
          <section className="pt-36 pb-20 px-6 relative" aria-labelledby="hero-heading">
            <div className="max-w-5xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 text-indigo-700 text-sm font-medium px-4 py-2 rounded-full mb-8 animate-fade-in">
                <BsLightningChargeFill className="w-4 h-4 text-indigo-500" />
                <span>Free & No Login Required</span>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              </div>

              {/* Main Heading */}
              <h1 id="hero-heading" className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-[1.1] tracking-tight animate-fade-in-up">
                Free Online Screenshot Editor
              </h1>
              <div className="relative inline-block mb-8 animate-fade-in-up">
                <span className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-wide whitespace-nowrap">
                  Make Screenshots Beautiful
                </span>
                <svg
                  className="absolute -bottom-3 left-0 w-full h-4"
                  viewBox="0 0 300 12"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8"
                    stroke="url(#underline-gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="animate-draw-line"
                  />
                  <defs>
                    <linearGradient
                      id="underline-gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#9333ea" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Subheading */}
              <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
                Transform boring screenshots into stunning visuals with beautiful frames,
                backgrounds, and annotations. Create code screenshots, text behind image effects, 
                video captions, and more. Perfect for documentation, social media, and presentations.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up animation-delay-300">
                <Link
                  href="/editor"
                  className="group relative inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-1"
                >
                  <HiOutlinePhotograph className="w-5 h-5" />
                  Screenshot Editor
                  <BsArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/code"
                  className="group inline-flex items-center justify-center gap-2 bg-white text-gray-900 font-semibold px-8 py-4 rounded-2xl border-2 border-gray-200 transition-all hover:border-gray-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <BsCode className="w-5 h-5" />
                  Code Screenshots
                </Link>
                <Link
                  href="/tools"
                  className="group inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-1"
                >
                  <TbSparkles className="w-5 h-5" />
                  All 18+ Tools
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-8 sm:gap-12 animate-fade-in-up animation-delay-400">
                {stats.map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Demo Image Section */}
          <section className="pb-24 px-6" aria-label="Editor Preview">
            <div className="max-w-5xl mx-auto">
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-500" />

                {/* Browser frame */}
                <div className="relative bg-white rounded-2xl shadow-2xl shadow-indigo-900/10 border border-gray-200/50 overflow-hidden">
                  {/* Browser header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-100 rounded-lg px-4 py-1.5 text-sm text-gray-500 text-center max-w-md mx-auto">
                        tsarr.in/editor
                      </div>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="relative overflow-hidden">
                    <Image
                      src="/images/main.webp"
                      alt="tsarr.in Screenshot Editor - Transform screenshots with frames, backgrounds and annotations"
                      width={1200}
                      height={675}
                      className="w-full h-auto transition-transform duration-700 group-hover:scale-[1.02]"
                      priority
                    />
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -right-4 top-24 bg-white rounded-xl shadow-xl shadow-indigo-900/10 px-4 py-3 border border-gray-100 animate-float hidden lg:block">
                  <div className="flex items-center gap-2">
                    <BsCheckCircleFill className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Export Ready
                    </span>
                  </div>
                </div>

                <div className="absolute -left-4 bottom-24 bg-white rounded-xl shadow-xl shadow-indigo-900/10 px-4 py-3 border border-gray-100 animate-float-delayed hidden lg:block">
                  <div className="flex items-center gap-2">
                    <BsStars className="w-5 h-5 text-indigo-500" />
                    <span className="text-sm font-medium text-gray-700">
                      20+ Themes
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* All Tools Section */}
          <section className="py-24 px-6 relative" aria-labelledby="tools-heading">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-50/30 to-transparent" />

            <div className="max-w-6xl mx-auto relative">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-full mb-4 shadow-sm">
                  <TbSparkles className="w-4 h-4 text-indigo-500" />
                  18+ Free Tools
                </div>
                <h2 id="tools-heading" className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  All Creative Tools
                </h2>
                <p className="text-gray-600 max-w-xl mx-auto">
                  Everything you need to create stunning visuals, all free and no login required
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {allTools.map((tool, index) => (
                  <Link
                    key={index}
                    href={tool.href}
                    className="group relative bg-white p-4 rounded-xl border border-gray-100 hover:border-indigo-200 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                  >
                    <div className={`w-10 h-10 bg-gradient-to-br ${tool.color} rounded-lg flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                      {tool.icon}
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">
                      {tool.title}
                    </h3>
                  </Link>
                ))}
              </div>

              <div className="text-center mt-8">
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View all tools with descriptions
                  <BsArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-24 px-6 relative" aria-labelledby="features-heading">
            <div className="max-w-6xl mx-auto relative">
              <div className="text-center mb-16">
                <h2 id="features-heading" className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  Powerful Features
                </h2>
                <p className="text-gray-600 max-w-xl mx-auto">
                  Professional-grade tools to make your screenshots stand out
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                  <article
                    key={index}
                    className="group relative bg-white p-6 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2"
                  >
                    <div className="w-12 h-12 bg-indigo-100 group-hover:bg-indigo-600 rounded-xl flex items-center justify-center text-indigo-600 group-hover:text-white mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-indigo-500/30">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-lg group-hover:text-indigo-900 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-600 transition-colors">
                      {feature.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="py-24 px-6" aria-labelledby="how-it-works-heading">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h2 id="how-it-works-heading" className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  Simple as 1-2-3
                </h2>
                <p className="text-gray-600">
                  Create stunning screenshots in seconds
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    step: "01",
                    title: "Upload",
                    desc: "Drop your screenshot or paste from clipboard",
                    icon: <HiOutlinePhotograph className="w-6 h-6" />,
                  },
                  {
                    step: "02",
                    title: "Customize",
                    desc: "Add frames, backgrounds, and annotations",
                    icon: <BsPalette className="w-6 h-6" />,
                  },
                  {
                    step: "03",
                    title: "Export",
                    desc: "Download in PNG, SVG, JPEG, or WebP format",
                    icon: <BsDownload className="w-6 h-6" />,
                  },
                ].map((item, i) => (
                  <article key={i} className="relative text-center group">
                    {i < 2 && (
                      <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-indigo-200 to-transparent" aria-hidden="true" />
                    )}

                    <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-white rounded-2xl shadow-lg flex items-center justify-center text-indigo-600 group-hover:shadow-xl transition-shadow">
                        {item.icon}
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg">
                        {item.step}
                      </div>
                    </div>

                    <h3 className="font-semibold text-gray-900 text-lg mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 text-sm">{item.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-24 px-6 bg-gray-50/50" aria-labelledby="faq-heading">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-full mb-4 shadow-sm">
                  <BsQuestionCircle className="w-4 h-4 text-indigo-500" />
                  FAQ
                </div>
                <h2 id="faq-heading" className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-gray-600">
                  Everything you need to know about tsarr.in
                </p>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                      aria-expanded={openFaq === index}
                    >
                      <span className="font-medium text-gray-900">{faq.q}</span>
                      <BsChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          openFaq === index ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {openFaq === index && (
                      <div className="px-6 pb-4 text-gray-600">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-24 px-6" aria-labelledby="cta-heading">
            <div className="max-w-4xl mx-auto">
              <div className="relative overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700" />

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" aria-hidden="true" />

                <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-20 text-center">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-full mb-6">
                    <HiCursorClick className="w-4 h-4" />
                    Start creating now
                  </div>

                  <h2 id="cta-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                    Ready to Create
                    <br />
                    Something Amazing?
                  </h2>

                  <p className="text-indigo-100 mb-10 max-w-lg mx-auto text-lg">
                    Join thousands of creators making beautiful screenshots. No
                    signup required, completely free.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/editor"
                      className="group inline-flex items-center justify-center gap-2 bg-white text-indigo-600 font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1"
                    >
                      Get Started Free
                      <BsArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href="/tools"
                      className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-2xl border border-white/20 transition-all hover:bg-white/20"
                    >
                      <TbSparkles className="w-5 h-5" />
                      Explore All Tools
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="py-16 px-6 border-t border-gray-100 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col items-center gap-8">
              <Link
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
              >
                tsarr.in
              </Link>

              {/* Footer Links for SEO */}
              <nav className="flex flex-wrap justify-center gap-4 text-sm text-gray-500" aria-label="Footer navigation">
                <Link href="/editor" className="hover:text-indigo-600 transition-colors">Screenshot Editor</Link>
                <Link href="/code" className="hover:text-indigo-600 transition-colors">Code Screenshots</Link>
                <Link href="/text-behind-image" className="hover:text-indigo-600 transition-colors">Text Behind Image</Link>
                <Link href="/captions" className="hover:text-indigo-600 transition-colors">Video Captions</Link>
                <Link href="/tweet" className="hover:text-indigo-600 transition-colors">Tweet Editor</Link>
                <Link href="/carousel" className="hover:text-indigo-600 transition-colors">Carousel Maker</Link>
                <Link href="/convert" className="hover:text-indigo-600 transition-colors">Image Converter</Link>
                <Link href="/resize" className="hover:text-indigo-600 transition-colors">Image Resizer</Link>
                <Link href="/tools" className="hover:text-indigo-600 transition-colors">All Tools</Link>
              </nav>

              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Created with ❤️ by{" "}
                  <a
                    href="https://tanishmittal.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline font-medium"
                  >
                    Tanish Mittal
                  </a>
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { href: "https://github.com/tansihmittal/", icon: <BsGithub />, label: "GitHub" },
                  { href: "https://x.com/mittaltani36318?s=11", icon: <BsTwitter />, label: "Twitter" },
                  { href: "https://www.instagram.com/tanishmittal02", icon: <BsInstagram />, label: "Instagram" },
                  { href: "https://www.linkedin.com/in/tanishmittal02/", icon: <BsLinkedin />, label: "LinkedIn" },
                  { href: "https://www.youtube.com/@tanishmittal", icon: <BsYoutube />, label: "YouTube" },
                  { href: "mailto:me@tanishmittal.com", icon: <BsEnvelope />, label: "Email" },
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-indigo-600 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5"
                    title={social.label}
                  >
                    <span className="text-gray-600 group-hover:text-white transition-colors text-lg">
                      {social.icon}
                    </span>
                    <span className="text-sm font-medium text-gray-600 group-hover:text-white transition-colors">
                      {social.label}
                    </span>
                  </a>
                ))}
              </div>

              <div className="text-center pt-8 border-t border-gray-100 w-full">
                <p className="text-sm text-gray-400">
                  © 2025 tsarr.in · Free Online Screenshot Editor · All rights reserved
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 10px) scale(1.05); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes draw-line {
          from { stroke-dasharray: 0, 500; }
          to { stroke-dasharray: 500, 0; }
        }
        .animate-blob {
          animation: blob 8s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 5s ease-in-out infinite;
          animation-delay: 1s;
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }
        .animation-delay-300 {
          animation-delay: 0.3s;
          opacity: 0;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }
        .animate-draw-line {
          animation: draw-line 1.5s ease-out forwards;
          animation-delay: 0.8s;
          stroke-dasharray: 0, 500;
        }
      `}</style>
    </>
  );
}