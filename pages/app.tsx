import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  BsImage, BsCode, BsType, BsCameraVideo, BsTwitter, BsAspectRatio,
  BsArrowsFullscreen, BsArrowRepeat, BsClipboard, BsBarChartFill,
  BsGlobe, BsCardImage, BsEraserFill, BsSoundwave, BsPencilSquare,
  BsChatSquare, BsPlus, BsSearch, BsThreeDotsVertical, BsTrash,
  BsFiles, BsPencil, BsFolder2, BsArrowRight, BsGrid3X3Gap, BsX, BsFire
} from "react-icons/bs";
import { MdSubtitles } from "react-icons/md";
import { RiSlideshow3Line } from "react-icons/ri";
import { toast } from "react-hot-toast";

import {
  Project,
  deleteProject,
  duplicateProject,
  renameProject,
  cacheProjects,
  getProjects,
  getRecentProjects,
} from "../utils/projectStorage";
import { trackToolUsage, sortToolsByUsage, getToolUsage } from "../utils/toolUsage";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const allTools = [
  { title: "Screenshot", href: "/editor", icon: BsImage, color: "bg-violet-500", desc: "Frames & backgrounds", slug: "screenshot-editor" },
  { title: "Code", href: "/code", icon: BsCode, color: "bg-emerald-500", desc: "Syntax highlighting", slug: "code-screenshots" },
  { title: "Text Behind", href: "/text-behind-image", icon: BsType, color: "bg-pink-500", desc: "AI background removal", slug: "text-behind-image" },
  { title: "Captions", href: "/captions", icon: MdSubtitles, color: "bg-blue-500", desc: "Video subtitles", slug: "video-captions" },
  { title: "Tweet", href: "/tweet", icon: BsTwitter, color: "bg-sky-500", desc: "Tweet screenshots", slug: "tweet-editor" },
  { title: "Carousel", href: "/carousel", icon: RiSlideshow3Line, color: "bg-orange-500", desc: "Multi-slide posts", slug: "carousel-editor" },
  { title: "Polaroid", href: "/polaroid", icon: BsCardImage, color: "bg-amber-500", desc: "Vintage effects", slug: "polaroid-generator" },
  { title: "Resize", href: "/resize", icon: BsArrowsFullscreen, color: "bg-lime-500", desc: "Image dimensions", slug: "image-resizer" },
];

const typeRoutes: Record<string, string> = {
  screenshot: "/editor",
  code: "/code",
  tweet: "/tweet",
  carousel: "/carousel",
  polaroid: "/polaroid",
  "text-behind-image": "/text-behind-image",
};

const typeLabels: Record<string, string> = {
  screenshot: "Screenshot",
  code: "Code",
  tweet: "Tweet",
  carousel: "Carousel",
  polaroid: "Polaroid",
  "text-behind-image": "Text Behind",
};

const typeColors: Record<string, string> = {
  screenshot: "bg-violet-500",
  code: "bg-emerald-500",
  tweet: "bg-sky-500",
  carousel: "bg-orange-500",
  polaroid: "bg-amber-500",
  "text-behind-image": "bg-pink-500",
};

const typeIcons: Record<string, any> = {
  screenshot: BsImage,
  code: BsCode,
  tweet: BsTwitter,
  carousel: RiSlideshow3Line,
  polaroid: BsCardImage,
  "text-behind-image": BsType,
};

export default function AppHome() {
  const router = useRouter();
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [tools, setTools] = useState(allTools);

  useEffect(() => {
    loadProjects();

    // Sort tools by usage
    const usage = getToolUsage();
    if (Object.keys(usage).length > 0) {
      setTools(sortToolsByUsage(allTools));
    }
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    await cacheProjects();
    setRecentProjects(getRecentProjects());
    setAllProjects(getProjects());
    setIsLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this project?")) {
      await deleteProject(id);
      await loadProjects();
      toast.success("Deleted");
    }
    setMenuOpen(null);
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await duplicateProject(id);
    await loadProjects();
    toast.success("Duplicated");
    setMenuOpen(null);
  };

  const handleRename = (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRenameId(id);
    setRenameName(name);
    setMenuOpen(null);
  };

  const handleToolClick = (slug: string, href: string) => {
    trackToolUsage(slug);
    router.push(href);
  };

  const submitRename = async () => {
    if (renameId && renameName.trim()) {
      await renameProject(renameId, renameName.trim());
      await loadProjects();
    }
    setRenameId(null);
    setRenameName("");
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const filteredProjects = allProjects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>tsarr.in | Creative Tools</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-800/50 pb-24 lg:pb-0" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-lg border-b border-[#E5E7EB]/80 dark:border-gray-700/80 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold text-[#0A0A0A] dark:text-white">
              tsarr.in
            </Link>

            {/* Desktop Search */}
            <div className="hidden sm:flex flex-1 max-w-sm mx-6">
              <div className="relative w-full">
                <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563] dark:text-gray-400 text-sm" />
                <Input
                  type="text"
                  placeholder="Search designs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 bg-[#F9FAFB] dark:bg-gray-800 rounded-[14px] text-sm focus:bg-white dark:focus:bg-gray-800 transition-all h-9"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild className="rounded-[14px]" title="Projects">
                <Link href="/projects">
                  <BsFolder2 className="text-lg" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild className="rounded-[14px]" title="All Tools">
                <Link href="/tools">
                  <BsGrid3X3Gap className="text-lg" />
                </Link>
              </Button>
              <Button asChild className="hidden sm:flex items-center gap-1.5 rounded-[14px] bg-[#2563EB] hover:bg-[#1D4ED8]">
                <Link href="/tools">
                  <BsPlus className="text-lg" />
                  <span>Create</span>
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-5">
          {/* Mobile Search */}
          <div className="sm:hidden mb-5">
            <div className="relative">
              <BsSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B5563] dark:text-gray-400" />
              <Input
                type="text"
                placeholder="Search designs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-[14px] text-base h-12"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#4B5563] dark:text-gray-400 hover:text-[#0A0A0A] dark:text-white"
                >
                  <BsX className="text-lg" />
                </button>
              )}
            </div>
          </div>

          {/* Welcome */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0A0A0A] dark:text-white mb-0.5">Welcome back</h1>
            <p className="text-[#4B5563] dark:text-gray-400 text-sm sm:text-base">What will you create today?</p>
          </div>

          {/* Quick Create - Mobile optimized horizontal scroll */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-[#0A0A0A] dark:text-white">Create new</h2>
              <Link href="/tools" className="text-sm text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 font-medium">
                All tools <BsArrowRight className="text-xs" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 lg:grid-cols-8 scrollbar-hide">
              {tools.map((tool, i) => {
                const Icon = tool.icon;
                const usage = getToolUsage()[tool.slug];
                const isFrequent = usage && usage.count >= 3;
                return (
                  <div
                    key={i}
                    onClick={() => handleToolClick(tool.slug, tool.href)}
                    className="flex-shrink-0 w-[100px] sm:w-auto group flex flex-col items-center p-3 sm:p-4 bg-white dark:bg-gray-900 rounded-[14px] border border-[#E5E7EB] dark:border-gray-700 hover:border-[#2563EB]/30 hover:shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <div className={`w-11 h-11 sm:w-12 sm:h-12 ${tool.color} rounded-[14px] flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-sm relative`}>
                      <Icon className="text-white text-lg sm:text-xl" />
                      {isFrequent && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                          <BsFire className="text-white text-[8px]" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-[#0A0A0A] dark:text-white text-center">{tool.title}</span>
                    <span className="text-[10px] sm:text-xs text-[#4B5563] dark:text-gray-400 text-center mt-0.5 hidden sm:block">{tool.desc}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recent Projects */}
          {!isLoading && recentProjects.length > 0 && !searchQuery && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-[#0A0A0A] dark:text-white">Recent</h2>
                <Link href="/projects" className="text-sm text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 font-medium">
                  All projects <BsArrowRight className="text-xs" />
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 scrollbar-hide">
                {recentProjects.slice(0, 5).map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    renameId={renameId}
                    renameName={renameName}
                    setRenameName={setRenameName}
                    submitRename={submitRename}
                    handleRename={handleRename}
                    handleDuplicate={handleDuplicate}
                    handleDelete={handleDelete}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Search Results */}
          {searchQuery && (
            <section>
              <h2 className="text-base font-semibold text-[#0A0A0A] dark:text-white mb-3">
                Results <span className="text-[#4B5563] dark:text-gray-400 font-normal">({filteredProjects.length})</span>
              </h2>
              {filteredProjects.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-[20px] border border-[#E5E7EB] dark:border-gray-700">
                  <BsSearch className="text-4xl text-[#4B5563]/60 dark:text-gray-400/60 mx-auto mb-3" />
                  <h3 className="font-medium text-[#0A0A0A] dark:text-white mb-1">No designs found</h3>
                  <p className="text-sm text-[#4B5563] dark:text-gray-400">Try a different search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      menuOpen={menuOpen}
                      setMenuOpen={setMenuOpen}
                      renameId={renameId}
                      renameName={renameName}
                      setRenameName={setRenameName}
                      submitRename={submitRename}
                      handleRename={handleRename}
                      handleDuplicate={handleDuplicate}
                      handleDelete={handleDelete}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Empty State */}
          {!isLoading && allProjects.length === 0 && !searchQuery && (
            <div className="text-center py-16 sm:py-20 bg-white dark:bg-gray-900 rounded-[20px] border border-[#E5E7EB] dark:border-gray-700">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#EFF6FF] dark:bg-blue-900/20 rounded-[20px] flex items-center justify-center mx-auto mb-5">
                <BsImage className="text-2xl sm:text-3xl text-[#2563EB]" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-[#0A0A0A] dark:text-white mb-2">Create your first design</h3>
              <p className="text-[#4B5563] dark:text-gray-400 mb-6 max-w-sm mx-auto text-sm sm:text-base px-4">
                Choose a tool above to get started. Your projects will appear here.
              </p>
              <Button asChild className="inline-flex items-center gap-2 rounded-[14px] bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95">
                <Link href="/tools">
                  <BsPlus className="text-xl" />
                  Browse all tools
                </Link>
              </Button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

// Project Card Component
interface ProjectCardProps {
  project: Project;
  menuOpen: string | null;
  setMenuOpen: (id: string | null) => void;
  renameId: string | null;
  renameName: string;
  setRenameName: (name: string) => void;
  submitRename: () => void;
  handleRename: (id: string, name: string, e: React.MouseEvent) => void;
  handleDuplicate: (id: string, e: React.MouseEvent) => void;
  handleDelete: (id: string, e: React.MouseEvent) => void;
  formatDate: (timestamp: number) => string;
}

function ProjectCard({
  project,
  menuOpen,
  setMenuOpen,
  renameId,
  renameName,
  setRenameName,
  submitRename,
  handleRename,
  handleDuplicate,
  handleDelete,
  formatDate,
}: ProjectCardProps) {
  const Icon = typeIcons[project.type] || BsImage;
  const colorClass = typeColors[project.type] || "bg-gray-500";

  return (
    <Link
      href={`${typeRoutes[project.type]}?project=${project.id}`}
      className="flex-shrink-0 w-[140px] sm:w-auto group relative bg-white dark:bg-gray-900 rounded-[14px] overflow-hidden border border-[#E5E7EB] dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all active:scale-[0.98]"
    >
      <div className="aspect-[4/3] bg-[#F9FAFB] dark:bg-gray-800 relative overflow-hidden">
        {project.thumbnail ? (
          <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="text-2xl sm:text-3xl text-[#4B5563]/60 dark:text-gray-400/60" />
          </div>
        )}
        <div className={`absolute top-2 left-2 w-5 h-5 sm:w-6 sm:h-6 ${colorClass} rounded-md flex items-center justify-center shadow-sm`}>
          <Icon className="text-white text-[10px] sm:text-xs" />
        </div>
      </div>

      <div className="p-2.5 sm:p-3">
        {renameId === project.id ? (
          <Input
            type="text"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => e.key === "Enter" && submitRename()}
            onClick={(e) => e.preventDefault()}
            className="w-full h-7 px-2 text-sm rounded-[10px]"
            autoFocus
          />
        ) : (
          <h3 className="font-medium text-[#0A0A0A] dark:text-white text-xs sm:text-sm truncate">{project.name}</h3>
        )}
        <p className="text-[10px] sm:text-xs text-[#4B5563] dark:text-gray-400 mt-0.5">{formatDate(project.updatedAt)}</p>
      </div>

      <DropdownMenu
        open={menuOpen === project.id}
        onOpenChange={(open) => setMenuOpen(open ? project.id : null)}
      >
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-[10px] opacity-0 group-hover:opacity-100 sm:transition-opacity hover:bg-white shadow-sm"
            style={{ opacity: menuOpen === project.id ? 1 : undefined }}
          >
            <BsThreeDotsVertical className="text-[#4B5563] dark:text-gray-400 text-sm" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[120px] rounded-[14px]">
          <DropdownMenuItem
            onClick={(e) => handleRename(project.id, project.name, e as unknown as React.MouseEvent)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <BsPencil className="text-[#4B5563] dark:text-gray-400" /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => handleDuplicate(project.id, e as unknown as React.MouseEvent)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <BsFiles className="text-[#4B5563] dark:text-gray-400" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => handleDelete(project.id, e as unknown as React.MouseEvent)}
            className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
          >
            <BsTrash /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Link>
  );
}
