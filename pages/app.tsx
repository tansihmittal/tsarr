import Head from "next/head";
import Link from "next/link";
import {
  BsImage, BsCode, BsType, BsCameraVideo, BsTwitter, BsAspectRatio,
  BsArrowsFullscreen, BsArrowRepeat, BsClipboard, BsBarChartFill,
  BsGlobe, BsCardImage, BsEraserFill, BsSoundwave, BsPencilSquare,
  BsChatSquare, BsGear
} from "react-icons/bs";
import { MdSubtitles } from "react-icons/md";
import { RiSlideshow3Line } from "react-icons/ri";

const tools = [
  { title: "Screenshot", desc: "Editor", href: "/editor", icon: BsImage, color: "bg-gradient-to-br from-violet-500 to-purple-600" },
  { title: "Code", desc: "Screenshots", href: "/code", icon: BsCode, color: "bg-gradient-to-br from-emerald-500 to-teal-600" },
  { title: "Text Behind", desc: "Image", href: "/text-behind-image", icon: BsType, color: "bg-gradient-to-br from-pink-500 to-rose-600" },
  { title: "Video", desc: "Captions", href: "/captions", icon: MdSubtitles, color: "bg-gradient-to-br from-blue-500 to-indigo-600" },
  { title: "Tweet", desc: "Editor", href: "/tweet", icon: BsTwitter, color: "bg-gradient-to-br from-sky-400 to-blue-500" },
  { title: "Carousel", desc: "Editor", href: "/carousel", icon: RiSlideshow3Line, color: "bg-gradient-to-br from-orange-500 to-amber-600" },
  { title: "Aspect", desc: "Ratio", href: "/aspect-ratio", icon: BsAspectRatio, color: "bg-gradient-to-br from-cyan-500 to-blue-600" },
  { title: "Image", desc: "Resizer", href: "/resize", icon: BsArrowsFullscreen, color: "bg-gradient-to-br from-lime-500 to-green-600" },
  { title: "Image", desc: "Converter", href: "/convert", icon: BsArrowRepeat, color: "bg-gradient-to-br from-fuchsia-500 to-pink-600" },
  { title: "Clipboard", desc: "Saver", href: "/clipboard", icon: BsClipboard, color: "bg-gradient-to-br from-slate-500 to-gray-600" },
  { title: "Video", desc: "Converter", href: "/video-convert", icon: BsCameraVideo, color: "bg-gradient-to-br from-red-500 to-rose-600" },
  { title: "Chart", desc: "Maker", href: "/chart", icon: BsBarChartFill, color: "bg-gradient-to-br from-indigo-500 to-violet-600" },
  { title: "Map", desc: "Maker", href: "/map", icon: BsGlobe, color: "bg-gradient-to-br from-teal-500 to-cyan-600" },
  { title: "3D", desc: "Globe", href: "/globe", icon: BsGlobe, color: "bg-gradient-to-br from-blue-600 to-indigo-700" },
  { title: "Polaroid", desc: "Generator", href: "/polaroid", icon: BsCardImage, color: "bg-gradient-to-br from-amber-500 to-orange-600" },
  { title: "Watermark", desc: "Remover", href: "/watermark-remover", icon: BsEraserFill, color: "bg-gradient-to-br from-red-600 to-pink-600" },
  { title: "Text to", desc: "Speech", href: "/tts", icon: BsSoundwave, color: "bg-gradient-to-br from-purple-500 to-indigo-600" },
  { title: "Image Text", desc: "Editor", href: "/image-text-editor", icon: BsPencilSquare, color: "bg-gradient-to-br from-green-500 to-emerald-600" },
  { title: "Bubble", desc: "Blaster", href: "/bubble-blaster", icon: BsChatSquare, color: "bg-gradient-to-br from-yellow-500 to-amber-600" },
];

export default function AppHome() {
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <>
      <Head>
        <title>tsarr.in | Creative Tools</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <header className="bg-white px-5 pt-12 pb-6 sticky top-0 z-40">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-gray-500 text-sm">{greeting()}</p>
              <h1 className="text-2xl font-bold text-gray-900">tsarr.in</h1>
            </div>
            <Link 
              href="/tools" 
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
            >
              <BsGear className="text-gray-600 text-lg" />
            </Link>
          </div>
          <p className="text-gray-500 text-sm">19+ free creative tools</p>
        </header>

        {/* Quick Actions */}
        <section className="px-5 mb-6">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white">
            <h2 className="font-semibold text-lg mb-2">Quick Start</h2>
            <p className="text-white/80 text-sm mb-4">Jump into your most used tools</p>
            <div className="flex gap-3">
              <Link 
                href="/editor" 
                className="flex-1 bg-white/20 backdrop-blur rounded-xl py-3 text-center text-sm font-medium hover:bg-white/30 transition-colors"
              >
                Screenshot
              </Link>
              <Link 
                href="/code" 
                className="flex-1 bg-white/20 backdrop-blur rounded-xl py-3 text-center text-sm font-medium hover:bg-white/30 transition-colors"
              >
                Code
              </Link>
              <Link 
                href="/convert" 
                className="flex-1 bg-white/20 backdrop-blur rounded-xl py-3 text-center text-sm font-medium hover:bg-white/30 transition-colors"
              >
                Convert
              </Link>
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="px-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Tools</h2>
          <div className="grid grid-cols-4 gap-4">
            {tools.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={i}
                  href={tool.href}
                  className="flex flex-col items-center group"
                >
                  <div className={`w-14 h-14 ${tool.color} rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-gray-200/50 group-active:scale-95 transition-transform`}>
                    <Icon className="text-white text-xl" />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">
                    {tool.title}
                  </span>
                  <span className="text-[10px] text-gray-400 text-center leading-tight">
                    {tool.desc}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recent / Tips Section */}
        <section className="px-5 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tips</h2>
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BsClipboard className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">Paste from clipboard</h3>
                  <p className="text-gray-500 text-xs mt-0.5">Press Ctrl+V anywhere to paste images directly</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BsArrowRepeat className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">Works offline</h3>
                  <p className="text-gray-500 text-xs mt-0.5">All tools work without internet after first visit</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
