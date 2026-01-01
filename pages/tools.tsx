import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { 
  BsArrowRight, BsGithub, BsTwitter, BsLinkedin, BsSearch, BsFolder2, BsImage, 
  BsCode, BsType, BsCameraVideo, BsCardImage, BsAspectRatio, BsArrowsFullscreen,
  BsArrowRepeat, BsClipboard, BsBarChartFill, BsGlobe, BsEraserFill, BsSoundwave,
  BsPencilSquare, BsChatSquare, BsX, BsFire
} from "react-icons/bs";
import { MdSubtitles } from "react-icons/md";
import { RiSlideshow3Line } from "react-icons/ri";
import { toolsData } from "@/data/toolsData";
import { Project, cacheProjects, getRecentProjects } from "@/utils/projectStorage";
import { sortToolsByUsage, trackToolUsage, getToolUsage } from "@/utils/toolUsage";


const typeRoutes: Record<string, string> = {
  screenshot: "/editor",
  code: "/code",
  tweet: "/tweet",
  carousel: "/carousel",
  polaroid: "/polaroid",
  "text-behind-image": "/text-behind-image",
};

// Unique icon for each tool by slug
const toolIcons: Record<string, any> = {
  "screenshot-editor": BsImage,
  "code-screenshots": BsCode,
  "text-behind-image": BsType,
  "video-captions": MdSubtitles,
  "tweet-editor": BsTwitter,
  "carousel-editor": RiSlideshow3Line,
  "aspect-ratio-converter": BsAspectRatio,
  "image-resizer": BsArrowsFullscreen,
  "image-converter": BsArrowRepeat,
  "clipboard-saver": BsClipboard,
  "video-converter": BsCameraVideo,
  "chart-maker": BsBarChartFill,
  "map-maker": BsGlobe,
  "3d-globe": BsGlobe,
  "polaroid-generator": BsCardImage,
  "watermark-remover": BsEraserFill,
  "text-to-speech": BsSoundwave,
  "image-text-editor": BsPencilSquare,
  "bubble-blaster": BsChatSquare,
};

// Unique color for each tool by slug
const toolColors: Record<string, string> = {
  "screenshot-editor": "bg-violet-500",
  "code-screenshots": "bg-emerald-500",
  "text-behind-image": "bg-pink-500",
  "video-captions": "bg-blue-500",
  "tweet-editor": "bg-sky-500",
  "carousel-editor": "bg-orange-500",
  "aspect-ratio-converter": "bg-teal-500",
  "image-resizer": "bg-lime-500",
  "image-converter": "bg-cyan-500",
  "clipboard-saver": "bg-amber-500",
  "video-converter": "bg-indigo-500",
  "chart-maker": "bg-rose-500",
  "map-maker": "bg-green-500",
  "3d-globe": "bg-purple-500",
  "polaroid-generator": "bg-yellow-500",
  "watermark-remover": "bg-red-500",
  "text-to-speech": "bg-fuchsia-500",
  "image-text-editor": "bg-slate-500",
  "bubble-blaster": "bg-stone-500",
};

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

export default function ToolsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortedTools, setSortedTools] = useState(toolsData);
  const [hasUsageData, setHasUsageData] = useState(false);

  useEffect(() => {
    const loadRecent = async () => {
      await cacheProjects();
      setRecentProjects(getRecentProjects());
    };
    loadRecent();
    
    // Sort tools by usage on client side
    const usage = getToolUsage();
    const hasUsage = Object.keys(usage).length > 0;
    setHasUsageData(hasUsage);
    if (hasUsage) {
      setSortedTools(sortToolsByUsage(toolsData));
    }
  }, []);

  const handleToolClick = (slug: string, href: string) => {
    trackToolUsage(slug);
    router.push(href);
  };

  const categories = ["all", ...Array.from(new Set(toolsData.map(t => t.category)))];
  
  const filteredTools = sortedTools.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Head>
        <title>All 19+ Free Image and Video Tools | tsarr.in</title>
        <meta name="description" content="Browse all 19+ free online tools: screenshot editor, code screenshots, video captions, image converter, and more. No login required." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="canonical" href="https://tsarr.in/tools" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolsListSchema) }} />
      </Head>

      <div className="min-h-screen bg-gray-50 pb-24 lg:pb-0">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-lg border-b border-gray-200/80 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold text-gray-900">
              tsarr.in
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/projects" className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                <BsFolder2 className="text-lg" />
              </Link>
              <Link href="/app" className="hidden sm:block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
                Dashboard
              </Link>
              <Link href="/editor" className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
                Open Editor
              </Link>
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {/* Hero - Mobile optimized */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">All Tools</h1>
            <p className="text-gray-600 text-sm sm:text-base">19+ free tools for screenshots, images, videos, and more.</p>
          </div>

          {/* Search and Filter - Mobile optimized */}
          <div className="space-y-3 mb-6">
            {/* Search */}
            <div className={`relative transition-all ${isSearchFocused ? 'ring-2 ring-indigo-500 rounded-xl' : ''}`}>
              <BsSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-base focus:outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <BsX className="text-lg" />
                </button>
              )}
            </div>
            
            {/* Category Pills - Horizontal scroll on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-all active:scale-95 ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Projects - Mobile optimized */}
          {recentProjects.length > 0 && !searchQuery && selectedCategory === "all" && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">Continue editing</h2>
                <Link href="/projects" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium">
                  All <BsArrowRight className="text-xs" />
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 scrollbar-hide">
                {recentProjects.slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    href={`${typeRoutes[project.type]}?project=${project.id}`}
                    className="flex-shrink-0 w-[140px] sm:w-auto group bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all active:scale-[0.98]"
                  >
                    <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                      {project.thumbnail ? (
                        <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BsImage className="text-2xl text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <h3 className="font-medium text-gray-900 text-sm truncate">{project.name}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Tools Grid - Mobile optimized */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              {selectedCategory === "all" ? (hasUsageData ? "Your tools" : "All tools") : selectedCategory} 
              <span className="text-gray-400 font-normal ml-2">({filteredTools.length})</span>
              {hasUsageData && selectedCategory === "all" && !searchQuery && (
                <span className="ml-2 text-xs font-normal text-orange-500 inline-flex items-center gap-1">
                  <BsFire /> Sorted by your usage
                </span>
              )}
            </h2>
            
            {filteredTools.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <BsSearch className="text-4xl text-gray-300 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-1">No tools found</h3>
                <p className="text-sm text-gray-500">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTools.map((tool, i) => {
                  const IconComponent = toolIcons[tool.slug] || BsImage;
                  const colorClass = toolColors[tool.slug] || "bg-gray-500";
                  const usage = getToolUsage()[tool.slug];
                  const isFrequent = usage && usage.count >= 3;
                  
                  return (
                    <div
                      key={i}
                      onClick={() => handleToolClick(tool.slug, tool.href)}
                      className="group bg-white rounded-xl p-4 border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-11 h-11 ${colorClass} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm relative`}>
                          <IconComponent className="text-white text-lg" />
                          {isFrequent && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                              <BsFire className="text-white text-[8px]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-0.5 group-hover:text-indigo-600 transition-colors">
                            {tool.title}
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-2">{tool.shortDesc}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {tool.features.slice(0, 3).map((feature, j) => (
                          <span key={j} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* CTA - Mobile optimized */}
          <section className="mt-10 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 sm:p-8 text-center text-white">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Ready to create?</h2>
            <p className="text-gray-400 mb-5 text-sm sm:text-base">All tools are free. No login required.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/editor" className="px-6 py-3 bg-white text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition-colors active:scale-95">
                Screenshot Editor
              </Link>
              <Link href="/code" className="px-6 py-3 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-colors border border-gray-600 active:scale-95">
                Code Screenshots
              </Link>
            </div>
          </section>
        </main>

        {/* Footer - Hidden on mobile (using MobileNav instead) */}
        <footer className="border-t border-gray-200 bg-white mt-12 hidden lg:block">
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
