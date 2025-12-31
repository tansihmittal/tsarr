import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  BsImage, BsCode, BsType, BsCameraVideo, BsTwitter, BsAspectRatio,
  BsArrowsFullscreen, BsArrowRepeat, BsClipboard, BsBarChartFill,
  BsGlobe, BsCardImage, BsEraserFill, BsSoundwave, BsPencilSquare,
  BsChatSquare, BsPlus, BsSearch, BsThreeDotsVertical, BsTrash,
  BsFiles, BsPencil, BsFolder2, BsArrowRight, BsGrid3X3Gap, BsX
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

const tools = [
  { title: "Screenshot", href: "/editor", icon: BsImage, color: "bg-violet-500", desc: "Frames & backgrounds" },
  { title: "Code", href: "/code", icon: BsCode, color: "bg-emerald-500", desc: "Syntax highlighting" },
  { title: "Text Behind", href: "/text-behind-image", icon: BsType, color: "bg-pink-500", desc: "AI background removal" },
  { title: "Captions", href: "/captions", icon: MdSubtitles, color: "bg-blue-500", desc: "Video subtitles" },
  { title: "Tweet", href: "/tweet", icon: BsTwitter, color: "bg-sky-500", desc: "Tweet screenshots" },
  { title: "Carousel", href: "/carousel", icon: RiSlideshow3Line, color: "bg-orange-500", desc: "Multi-slide posts" },
  { title: "Polaroid", href: "/polaroid", icon: BsCardImage, color: "bg-amber-500", desc: "Vintage effects" },
  { title: "Resize", href: "/resize", icon: BsArrowsFullscreen, color: "bg-lime-500", desc: "Image dimensions" },
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
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
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

      <div className="min-h-screen bg-gray-50 pb-24 lg:pb-0">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-lg border-b border-gray-200/80 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold text-gray-900">
              tsarr.in
            </Link>
            
            {/* Desktop Search */}
            <div className="hidden sm:flex flex-1 max-w-sm mx-6">
              <div className="relative w-full">
                <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search designs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/projects" className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors" title="Projects">
                <BsFolder2 className="text-lg" />
              </Link>
              <Link href="/tools" className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors" title="All Tools">
                <BsGrid3X3Gap className="text-lg" />
              </Link>
              <Link href="/tools" className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                <BsPlus className="text-lg" />
                <span>Create</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-5">
          {/* Mobile Search */}
          <div className="sm:hidden mb-5">
            <div className="relative">
              <BsSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search designs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600"
                >
                  <BsX className="text-lg" />
                </button>
              )}
            </div>
          </div>

          {/* Welcome */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">Welcome back</h1>
            <p className="text-gray-500 text-sm sm:text-base">What will you create today?</p>
          </div>

          {/* Quick Create - Mobile optimized horizontal scroll */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Create new</h2>
              <Link href="/tools" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium">
                All tools <BsArrowRight className="text-xs" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 lg:grid-cols-8 scrollbar-hide">
              {tools.map((tool, i) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={i}
                    href={tool.href}
                    className="flex-shrink-0 w-[100px] sm:w-auto group flex flex-col items-center p-3 sm:p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-md transition-all active:scale-95"
                  >
                    <div className={`w-11 h-11 sm:w-12 sm:h-12 ${tool.color} rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-sm`}>
                      <Icon className="text-white text-lg sm:text-xl" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-900 text-center">{tool.title}</span>
                    <span className="text-[10px] sm:text-xs text-gray-500 text-center mt-0.5 hidden sm:block">{tool.desc}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Recent Projects */}
          {!isLoading && recentProjects.length > 0 && !searchQuery && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">Recent</h2>
                <Link href="/projects" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium">
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
              <h2 className="text-base font-semibold text-gray-900 mb-3">
                Results <span className="text-gray-400 font-normal">({filteredProjects.length})</span>
              </h2>
              {filteredProjects.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <BsSearch className="text-4xl text-gray-300 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-1">No designs found</h3>
                  <p className="text-sm text-gray-500">Try a different search term</p>
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
            <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border border-gray-200">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <BsImage className="text-2xl sm:text-3xl text-indigo-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Create your first design</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm sm:text-base px-4">
                Choose a tool above to get started. Your projects will appear here.
              </p>
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors active:scale-95"
              >
                <BsPlus className="text-xl" />
                Browse all tools
              </Link>
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
      className="flex-shrink-0 w-[140px] sm:w-auto group relative bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all active:scale-[0.98]"
    >
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        {project.thumbnail ? (
          <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="text-2xl sm:text-3xl text-gray-300" />
          </div>
        )}
        <div className={`absolute top-2 left-2 w-5 h-5 sm:w-6 sm:h-6 ${colorClass} rounded-md flex items-center justify-center shadow-sm`}>
          <Icon className="text-white text-[10px] sm:text-xs" />
        </div>
      </div>
      
      <div className="p-2.5 sm:p-3">
        {renameId === project.id ? (
          <input
            type="text"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => e.key === "Enter" && submitRename()}
            onClick={(e) => e.preventDefault()}
            className="w-full px-2 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
        ) : (
          <h3 className="font-medium text-gray-900 text-xs sm:text-sm truncate">{project.name}</h3>
        )}
        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{formatDate(project.updatedAt)}</p>
      </div>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuOpen(menuOpen === project.id ? null : project.id);
        }}
        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 sm:transition-opacity hover:bg-white shadow-sm"
        style={{ opacity: menuOpen === project.id ? 1 : undefined }}
      >
        <BsThreeDotsVertical className="text-gray-600 text-sm" />
      </button>

      {menuOpen === project.id && (
        <>
          <div className="fixed inset-0 z-10" onClick={(e) => { e.preventDefault(); setMenuOpen(null); }} />
          <div className="absolute top-10 right-2 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-20 min-w-[120px]">
            <button
              onClick={(e) => handleRename(project.id, project.name, e)}
              className="w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 active:bg-gray-100"
            >
              <BsPencil className="text-gray-400" /> Rename
            </button>
            <button
              onClick={(e) => handleDuplicate(project.id, e)}
              className="w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 active:bg-gray-100"
            >
              <BsFiles className="text-gray-400" /> Duplicate
            </button>
            <button
              onClick={(e) => handleDelete(project.id, e)}
              className="w-full px-3 py-2.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 active:bg-red-100"
            >
              <BsTrash /> Delete
            </button>
          </div>
        </>
      )}
    </Link>
  );
}
