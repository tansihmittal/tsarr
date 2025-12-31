import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  BsPlus, BsThreeDotsVertical, BsTrash, BsFiles, BsPencil,
  BsImage, BsCode, BsTwitter, BsCardImage, BsType,
  BsGrid3X3Gap, BsList, BsSearch, BsFolder2Open, BsArrowLeft, BsX
} from "react-icons/bs";
import { RiSlideshow3Line } from "react-icons/ri";
import { toast } from "react-hot-toast";
import MobileNav from "@/components/common/MobileNav";
import {
  Project,
  deleteProject,
  duplicateProject,
  renameProject,
  getStorageUsage,
  cacheProjects,
  getProjects,
} from "../utils/projectStorage";

const typeIcons: Record<string, any> = {
  screenshot: BsImage,
  code: BsCode,
  tweet: BsTwitter,
  carousel: RiSlideshow3Line,
  polaroid: BsCardImage,
  "text-behind-image": BsType,
};

const typeLabels: Record<string, string> = {
  screenshot: "Screenshot",
  code: "Code",
  tweet: "Tweet",
  carousel: "Carousel",
  polaroid: "Polaroid",
  "text-behind-image": "Text Behind",
};

const typeRoutes: Record<string, string> = {
  screenshot: "/editor",
  code: "/code",
  tweet: "/tweet",
  carousel: "/carousel",
  polaroid: "/polaroid",
  "text-behind-image": "/text-behind-image",
};

const typeColors: Record<string, string> = {
  screenshot: "bg-violet-500",
  code: "bg-emerald-500",
  tweet: "bg-sky-500",
  carousel: "bg-orange-500",
  polaroid: "bg-amber-500",
  "text-behind-image": "bg-pink-500",
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [storage, setStorage] = useState({ used: 0, total: 0, percentage: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    await cacheProjects();
    setProjects(getProjects());
    const storageInfo = await getStorageUsage();
    setStorage(storageInfo);
    setIsLoading(false);
  };

  const filteredProjects = projects
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || p.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return b.updatedAt - a.updatedAt;
    });

  const handleDelete = async (id: string) => {
    if (confirm("Delete this project?")) {
      await deleteProject(id);
      await loadProjects();
      toast.success("Deleted");
    }
    setMenuOpen(null);
  };

  const handleDuplicate = async (id: string) => {
    await duplicateProject(id);
    await loadProjects();
    toast.success("Duplicated");
    setMenuOpen(null);
  };

  const handleRename = (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (project) {
      setRenameId(id);
      setRenameName(project.name);
    }
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

  const openProject = (project: Project) => {
    router.push(`${typeRoutes[project.type]}?project=${project.id}`);
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

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const projectsByType = projects.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <Head>
        <title>My Projects | tsarr.in</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className="min-h-screen bg-gray-50 pb-24 lg:pb-0">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-lg border-b border-gray-200/80 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/app" className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
                <BsArrowLeft className="text-gray-600" />
              </Link>
              <div>
                <h1 className="font-semibold text-gray-900">Projects</h1>
                <p className="text-xs text-gray-500">{projects.length} designs</p>
              </div>
            </div>
            <Link
              href="/tools"
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <BsPlus className="text-lg" />
              <span className="hidden sm:inline">Create</span>
            </Link>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          {/* Stats - Mobile optimized */}
          {projects.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{projects.length}</p>
                <p className="text-xs text-gray-500">Total projects</p>
              </div>
              <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium text-gray-700">Storage</p>
                  <p className="text-xs text-gray-500">{formatBytes(storage.used)}</p>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(storage.percentage, 100)}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* Filters - Mobile optimized */}
          <div className="space-y-3 mb-5">
            <div className="relative">
              <BsSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
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
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-shrink-0"
              >
                <option value="all">All types</option>
                {Object.entries(typeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "recent" | "name")}
                className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-shrink-0"
              >
                <option value="recent">Recent</option>
                <option value="name">Name</option>
              </select>
              <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 ${viewMode === "grid" ? "bg-gray-100 text-indigo-600" : "text-gray-500 hover:bg-gray-50"} transition-colors`}
                >
                  <BsGrid3X3Gap />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 ${viewMode === "list" ? "bg-gray-100 text-indigo-600" : "text-gray-500 hover:bg-gray-50"} transition-colors`}
                >
                  <BsList />
                </button>
              </div>
            </div>
          </div>

          {/* Projects */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-gray-100" />
                  <div className="p-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border border-gray-200">
              <BsFolder2Open className="text-4xl sm:text-5xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                {projects.length === 0 ? "No projects yet" : "No matching projects"}
              </h3>
              <p className="text-gray-500 mb-5 text-sm px-4">
                {projects.length === 0 ? "Create your first design" : "Try different filters"}
              </p>
              <Link href="/tools" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 active:scale-95 transition-all">
                <BsPlus className="text-lg" /> Create design
              </Link>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredProjects.map((project) => {
                const Icon = typeIcons[project.type] || BsImage;
                const colorClass = typeColors[project.type] || "bg-gray-500";
                const isRenaming = renameId === project.id;

                return (
                  <div
                    key={project.id}
                    className="group relative bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer active:scale-[0.98]"
                    onClick={() => !isRenaming && openProject(project)}
                  >
                    <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                      {project.thumbnail ? (
                        <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className="text-3xl sm:text-4xl text-gray-300" />
                        </div>
                      )}
                      <div className={`absolute top-2 left-2 w-5 h-5 sm:w-6 sm:h-6 ${colorClass} rounded-md flex items-center justify-center shadow-sm`}>
                        <Icon className="text-white text-[10px] sm:text-xs" />
                      </div>
                    </div>
                    <div className="p-2.5 sm:p-3">
                      {isRenaming ? (
                        <input
                          type="text"
                          value={renameName}
                          onChange={(e) => setRenameName(e.target.value)}
                          onBlur={submitRename}
                          onKeyDown={(e) => e.key === "Enter" && submitRename()}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-2 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                      ) : (
                        <h3 className="font-medium text-gray-900 truncate text-xs sm:text-sm">{project.name}</h3>
                      )}
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{formatDate(project.updatedAt)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === project.id ? null : project.id); }}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 sm:transition-opacity hover:bg-white shadow-sm"
                      style={{ opacity: menuOpen === project.id ? 1 : undefined }}
                    >
                      <BsThreeDotsVertical className="text-gray-600 text-sm" />
                    </button>
                    {menuOpen === project.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(null); }} />
                        <div className="absolute top-10 right-2 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-20 min-w-[120px]">
                          <button onClick={(e) => { e.stopPropagation(); handleRename(project.id); }} className="w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 active:bg-gray-100">
                            <BsPencil className="text-gray-400" /> Rename
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDuplicate(project.id); }} className="w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 active:bg-gray-100">
                            <BsFiles className="text-gray-400" /> Duplicate
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }} className="w-full px-3 py-2.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 active:bg-red-100">
                            <BsTrash /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {filteredProjects.map((project) => {
                const Icon = typeIcons[project.type] || BsImage;
                const colorClass = typeColors[project.type] || "bg-gray-500";
                return (
                  <div
                    key={project.id}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100"
                    onClick={() => openProject(project)}
                  >
                    <div className="w-14 h-10 sm:w-16 sm:h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                      {project.thumbnail ? (
                        <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate text-sm">{project.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`w-4 h-4 ${colorClass} rounded flex items-center justify-center`}>
                          <Icon className="text-white text-[8px]" />
                        </span>
                        <span className="text-xs text-gray-500">{typeLabels[project.type]} · {formatDate(project.updatedAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === project.id ? null : project.id); }}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <BsThreeDotsVertical className="text-gray-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Mobile Navigation */}
        <MobileNav />
      </div>
    </>
  );
}
