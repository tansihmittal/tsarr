import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  BsArrowRight, BsGithub, BsTwitter, BsLinkedin, BsSearch, BsFolder2, BsImage,
  BsCode, BsType, BsCameraVideo, BsCardImage, BsAspectRatio, BsArrowsFullscreen,
  BsArrowRepeat, BsClipboard, BsBarChartFill, BsGlobe, BsEraserFill, BsSoundwave,
  BsPencilSquare, BsChatSquare, BsX, BsFire, BsScissors, BsQrCode, BsPalette, BsPinMap
} from "react-icons/bs";
import { MdSubtitles } from "react-icons/md";
import { RiSlideshow3Line } from "react-icons/ri";
import { toolsData } from "@/data/toolsData";
import { Project, cacheProjects, getRecentProjects } from "@/utils/projectStorage";
import { sortToolsByUsage, trackToolUsage, getToolUsage } from "@/utils/toolUsage";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";

const FONT = "'IBM Plex Sans', sans-serif";

const typeRoutes: Record<string, string> = {
  screenshot: "/editor",
  code: "/code",
  tweet: "/tweet",
  carousel: "/carousel",
  polaroid: "/polaroid",
  "text-behind-image": "/text-behind-image",
};

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
  "background-remover": BsScissors,
  "qr-code-generator": BsQrCode,
  "color-palette-extractor": BsPalette,
  "image-map-pro": BsPinMap,
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
    url: `https://tsarr.in/tool/${tool.slug}`,
  })),
};

export default function ToolsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [sortedTools, setSortedTools] = useState(toolsData);
  const [hasUsageData, setHasUsageData] = useState(false);

  useEffect(() => {
    const loadRecent = async () => {
      await cacheProjects();
      setRecentProjects(getRecentProjects());
    };
    loadRecent();

    const usage = getToolUsage();
    const hasUsage = Object.keys(usage).length > 0;
    setHasUsageData(hasUsage);
    if (hasUsage) setSortedTools(sortToolsByUsage(toolsData));
  }, []);

  const handleToolClick = (slug: string, href: string) => {
    trackToolUsage(slug);
    router.push(href);
  };

  const categories = ["all", ...Array.from(new Set(toolsData.map((t) => t.category)))];

  const filteredTools = sortedTools.filter((tool) => {
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

      <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-800/50 pb-24 lg:pb-0" style={{ fontFamily: FONT }}>

        {/* ── Header ── */}
        <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-[#E5E7EB] dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="text-base font-semibold text-[#0A0A0A] dark:text-white">
              tsarr.in
            </Link>
            <nav className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild className="rounded-full w-9 h-9">
                <Link href="/projects" title="My Projects">
                  <BsFolder2 className="w-4 h-4" />
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/editor">Open Editor</Link>
              </Button>
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

          {/* ── Page title ── */}
          <div className="mb-8">
            <h1
              className="font-normal text-[#0A0A0A] dark:text-white mb-1"
              style={{ fontSize: "clamp(28px,4vw,40px)", lineHeight: 1.1, letterSpacing: "-1.5px" }}
            >
              All Tools
            </h1>
            <p className="text-[#4B5563] dark:text-gray-400" style={{ fontSize: 16 }}>
              {toolsData.length}+ free tools for screenshots, images, videos, and more.
            </p>
          </div>

          {/* ── Search + filters ── */}
          <div className="space-y-3 mb-8">
            {/* Search */}
            <div className="relative">
              <BsSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B5563]/60 text-sm pointer-events-none z-10" />
              <Input
                type="text"
                placeholder="Search tools…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4B5563]/60 hover:text-[#0A0A0A] transition-colors"
                >
                  <BsX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-[#0A0A0A] dark:bg-white text-white dark:text-gray-900"
                      : "bg-white dark:bg-gray-900 text-[#4B5563] dark:text-gray-400 border border-[#E5E7EB] dark:border-gray-700 hover:border-[#60A5FA] hover:text-[#0A0A0A] dark:hover:text-white"
                  }`}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* ── Recent Projects ── */}
          {recentProjects.length > 0 && !searchQuery && selectedCategory === "all" && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-[#0A0A0A] dark:text-white" style={{ fontSize: 16 }}>
                  Continue editing
                </h2>
                <Button variant="link" size="sm" asChild>
                  <Link href="/projects">
                    All <BsArrowRight className="w-3 h-3" />
                  </Link>
                </Button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {recentProjects.slice(0, 5).map((project) => (
                  <Link key={project.id} href={`${typeRoutes[project.type]}?project=${project.id}`} className="block flex-shrink-0 w-[140px] sm:w-auto">
                    <Card className="overflow-hidden hover:border-[#60A5FA]">
                      <div className="aspect-[4/3] bg-[#F3F4F6] dark:bg-gray-800 relative overflow-hidden">
                        {project.thumbnail ? (
                          <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BsImage className="text-xl text-[#E5E7EB]" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-2.5">
                        <p className="font-medium text-[#0A0A0A] dark:text-white text-sm truncate">{project.name}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Tools grid ── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-medium text-[#0A0A0A] dark:text-white" style={{ fontSize: 16 }}>
                {selectedCategory === "all"
                  ? hasUsageData ? "Your tools" : "All tools"
                  : selectedCategory}
              </h2>
              <Badge>
                {filteredTools.length}
              </Badge>
              {hasUsageData && selectedCategory === "all" && !searchQuery && (
                <span className="inline-flex items-center gap-1 text-xs text-[#F97316]" style={{ fontSize: 12 }}>
                  <BsFire className="w-3 h-3" /> Sorted by usage
                </span>
              )}
            </div>

            {filteredTools.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-[20px] border border-[#E5E7EB] dark:border-gray-700">
                <BsSearch className="text-4xl text-[#E5E7EB] dark:text-gray-700 mx-auto mb-3" />
                <h3 className="font-medium text-[#0A0A0A] dark:text-white mb-1">No tools found</h3>
                <p className="text-sm text-[#4B5563] dark:text-gray-400">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTools.map((tool, i) => {
                  const IconComponent = toolIcons[tool.slug] || BsImage;
                  const usage = getToolUsage()[tool.slug];
                  const isFrequent = usage && usage.count >= 3;

                  return (
                    <Card
                      key={i}
                      className="group cursor-pointer bg-white dark:bg-gray-900 hover:border-[#DBEAFE] hover:bg-[#EFF6FF] dark:hover:bg-blue-900/30 p-4"
                      onClick={() => handleToolClick(tool.slug, tool.href)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-[#EFF6FF] text-[#2563EB] rounded-[10px] flex items-center justify-center flex-shrink-0 group-hover:bg-[#DBEAFE] transition-colors relative">
                          <IconComponent className="text-lg" />
                          {isFrequent && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#F97316] rounded-full flex items-center justify-center">
                              <BsFire className="text-white text-[8px]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[#0A0A0A] dark:text-white mb-0.5 group-hover:text-[#2563EB] transition-colors" style={{ fontSize: 14 }}>
                            {tool.title}
                          </h3>
                          <p className="text-[#4B5563] dark:text-gray-400 line-clamp-2" style={{ fontSize: 12 }}>
                            {tool.shortDesc}
                          </p>
                        </div>
                      </div>
                      {tool.features?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {tool.features.slice(0, 3).map((feature: string, j: number) => (
                            <Badge key={j} size="sm">{feature}</Badge>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── CTA ── */}
          <section
            className="mt-12 rounded-[20px] p-8 text-center"
            style={{ background: "linear-gradient(145deg, #EFF6FF 0%, #DBEAFE 60%, #EFF6FF 100%)" }}
          >
            <h2
              className="font-normal text-[#0A0A0A] dark:text-white mb-2"
              style={{ fontSize: "clamp(20px,3vw,28px)", lineHeight: 1.1, letterSpacing: "-1px" }}
            >
              Ready to create?
            </h2>
            <p className="text-[#4B5563] dark:text-gray-400 mb-6" style={{ fontSize: 15 }}>
              All tools are free. No login required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/editor">Screenshot Editor</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/code">Code Screenshots</Link>
              </Button>
            </div>
          </section>
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900 mt-12 hidden lg:block">
          <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[#4B5563] dark:text-gray-400" style={{ fontSize: 14 }}>
              © 2025 tsarr.in ·{" "}
              <a href="https://tanishmittal.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#0A0A0A] dark:hover:text-white transition-colors">
                Tanish Mittal
              </a>
            </p>
            <div className="flex items-center gap-4">
              {[
                { href: "https://github.com/tansihmittal/", icon: <BsGithub className="w-4 h-4" /> },
                { href: "https://x.com/glowdopera", icon: <BsTwitter className="w-4 h-4" /> },
                { href: "https://linkedin.com/in/tanishmittal02", icon: <BsLinkedin className="w-4 h-4" /> },
              ].map(({ href, icon }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="text-[#4B5563] dark:text-gray-400 hover:text-[#0A0A0A] dark:hover:text-white transition-colors">
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
