import Head from "next/head";
import Link from "next/link";
import { useRef } from "react";
import {
  BsImage,
  BsCode,
  BsType,
  BsArrowRight,
  BsTwitter,
  BsAspectRatio,
  BsArrowsFullscreen,
  BsArrowRepeat,
  BsClipboard,
  BsCameraVideo,
  BsBarChartFill,
  BsGlobe,
  BsPencilSquare,
  BsChatSquare,
  BsCardImage,
  BsEraserFill,
  BsGithub,
  BsInstagram,
  BsLinkedin,
  BsYoutube,
  BsEnvelope,
} from "react-icons/bs";
import { MdSubtitles } from "react-icons/md";
import { RiSlideshow3Line } from "react-icons/ri";

interface EditorCard {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

export default function ToolsPage() {
  const themeSwatch = useRef<HTMLInputElement>(null);

  const themeToggle = () => {
    document.body.dataset.theme = themeSwatch?.current?.checked
      ? "dark"
      : "bumblebee";
  };

  const editors: EditorCard[] = [
    {
      title: "Screenshot Editor",
      description: "Transform screenshots with frames, backgrounds & annotations",
      href: "/editor",
      icon: <BsImage className="w-6 h-6" />,
      color: "from-indigo-500 to-purple-600",
    },
    {
      title: "Code Editor",
      description: "Beautiful code screenshots with syntax highlighting",
      href: "/code",
      icon: <BsCode className="w-6 h-6" />,
      color: "from-emerald-500 to-teal-600",
    },
    {
      title: "Text Behind Image",
      description: "Create stunning text behind image effects",
      href: "/text-behind-image",
      icon: <BsType className="w-6 h-6" />,
      color: "from-purple-500 to-pink-600",
    },
    {
      title: "Video Captions",
      description: "Add stylish captions and subtitles to videos",
      href: "/captions",
      icon: <MdSubtitles className="w-6 h-6" />,
      color: "from-orange-500 to-red-600",
    },
    {
      title: "Tweet Editor",
      description: "Create beautiful tweet screenshots for social media",
      href: "/tweet",
      icon: <BsTwitter className="w-6 h-6" />,
      color: "from-sky-500 to-blue-600",
    },
    {
      title: "Carousel Editor",
      description: "Create stunning multi-slide carousels for social media",
      href: "/carousel",
      icon: <RiSlideshow3Line className="w-6 h-6" />,
      color: "from-rose-500 to-pink-600",
    },
    {
      title: "Aspect Ratio Converter",
      description: "Convert images to any aspect ratio with multiple resolutions",
      href: "/aspect-ratio",
      icon: <BsAspectRatio className="w-6 h-6" />,
      color: "from-cyan-500 to-blue-600",
    },
    {
      title: "Image Resizer",
      description: "Resize images to exact dimensions or by percentage",
      href: "/resize",
      icon: <BsArrowsFullscreen className="w-6 h-6" />,
      color: "from-amber-500 to-orange-600",
    },
    {
      title: "Image Converter",
      description: "Convert images between PNG, JPG, WebP, AVIF, GIF, BMP, ICO",
      href: "/convert",
      icon: <BsArrowRepeat className="w-6 h-6" />,
      color: "from-green-500 to-emerald-600",
    },
    {
      title: "Clipboard to Image",
      description: "Paste images from clipboard and download in any format",
      href: "/clipboard",
      icon: <BsClipboard className="w-6 h-6" />,
      color: "from-violet-500 to-purple-600",
    },
    {
      title: "Video Converter",
      description: "Convert videos to MP4, WebM, AVI, MOV, GIF with custom settings",
      href: "/video-convert",
      icon: <BsCameraVideo className="w-6 h-6" />,
      color: "from-red-500 to-rose-600",
    },
    {
      title: "Chart Maker",
      description: "Create beautiful charts and graphs for presentations",
      href: "/chart",
      icon: <BsBarChartFill className="w-6 h-6" />,
      color: "from-teal-500 to-cyan-600",
    },
    {
      title: "Map Maker",
      description: "Create choropleth, bubble, marker, and flow maps",
      href: "/map",
      icon: <BsGlobe className="w-6 h-6" />,
      color: "from-indigo-500 to-blue-600",
    },
    {
      title: "3D Globe",
      description: "Create interactive 3D globe visualizations with points and arcs",
      href: "/globe",
      icon: <BsGlobe className="w-6 h-6" />,
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "Image Text Editor (Beta)",
      description: "Edit any text in images with AI-powered OCR detection",
      href: "/image-text-editor",
      icon: <BsPencilSquare className="w-6 h-6" />,
      color: "from-fuchsia-500 to-purple-600",
    },
    {
      title: "Bubble Blaster (Beta)",
      description: "Remove text from manga speech bubbles instantly",
      href: "/bubble-blaster",
      icon: <BsChatSquare className="w-6 h-6" />,
      color: "from-pink-500 to-rose-600",
    },
    {
      title: "Polaroid Generator",
      description: "Transform images into vintage polaroid-style photos",
      href: "/polaroid",
      icon: <BsCardImage className="w-6 h-6" />,
      color: "from-amber-500 to-yellow-600",
    },
    {
      title: "Watermark Remover (Beta)",
      description: "Remove watermarks from images with intelligent inpainting",
      href: "/watermark-remover",
      icon: <BsEraserFill className="w-6 h-6" />,
      color: "from-red-500 to-orange-600",
    },
  ];

  return (
    <>
      <Head>
        <title>tsarr.in - Tools</title>
        <meta
          name="description"
          content="Beautiful screenshot editor, code screenshots, text behind image effects, and video captions"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen editor-bg">
        {/* Header */}
        <header className="border-b-2 h-[70px] bg-base-100 border-b-base-200 flex items-center">
          <div className="container mx-auto px-4 lg:px-0 flex items-center justify-between">
            <Link 
              href="/" 
              className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              tsarr.in
            </Link>

            <label
              className="swap swap-rotate text-primary-content"
              onClick={themeToggle}
            >
              <input type="checkbox" ref={themeSwatch} />
              <svg className="swap-on fill-current w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
              </svg>
              <svg className="swap-off fill-current w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
              </svg>
            </label>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-12 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-primary-content mb-4">
                Creative Tools
              </h1>
              <p className="text-lg text-primary-content/60">
                Choose an editor to get started
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {editors.map((editor, index) => (
                <Link
                  key={index}
                  href={editor.href}
                  className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl bg-base-100 border-2 border-base-200 hover:border-base-300"
                >
                  <div className={`h-32 bg-gradient-to-br ${editor.color} flex items-center justify-center`}>
                    <div className="text-white text-4xl opacity-80 group-hover:scale-110 transition-transform duration-300">
                      {editor.icon}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-primary-content mb-1">
                          {editor.title}
                        </h2>
                        <p className="text-sm text-primary-content/60">
                          {editor.description}
                        </p>
                      </div>
                      <div className="p-2 rounded-full transition-all duration-300 group-hover:translate-x-1 text-primary-content/50">
                        <BsArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>

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
    </>
  );
}
