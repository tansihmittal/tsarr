import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  BsPlus, BsThreeDotsVertical, BsTrash, BsFiles, BsPencil,
  BsImage, BsCode, BsTwitter, BsCardImage, BsType, BsClock,
  BsGrid3X3Gap, BsList, BsSearch, BsFolder2Open
} from "react-icons/bs";
import { RiSlideshow3Line } from "react-icons/ri";
import { toast } from "react-hot-toast";
import {
  Project,
  getProjects,
  getRecentProjects,
  deleteProject,
  duplicateProject,
  renameProject,
  getStorageUsage,
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

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [storage, setStorage] = useState({ used: 0, total: 0, percentage: 0 });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    setProjects(getProjects());
    setRecentProjects(getRecentProjects());
    setStorage(getStorageUsage());
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || p.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = (id: string) => {
    if (confirm("Delete this project? This cannot be undone.")) {
      deleteProject(id);
      loadProjects();
      toast.success("Project deleted");
    }
    setMenuOpen(null);
  };

  const handleDuplicate = (id: string) => {
    duplicateProject(id);
    loadProjects();
    toast.success("Project duplicated");
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

  const submitRename = () => {
    if (renameId && renameName.trim()) {
      renameProject(renameId, renameName.trim());
      loadProjects();
      toast.success("Project renamed");
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
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const ProjectCard = ({ project }: { project: Project }) => {
    const Icon = typeIcons[project.type] || BsImage;
    const isRenaming = renameId === project.id;

    return (
      <div className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all">
        {/* Thumbnail */}
        <div
          className="aspect-video bg-gray-100 cursor-pointer relative overflow-hidden"
          onClick={() => !isRenaming && openProject(project)}
        >
          {project.thumbnail ? (
            <img
              src={project.thumbnail}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon className="text-4xl text-gray-300" />
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 bg-white px-4 py-2 rounded-lg font-medium text-sm shadow-lg transition-opacity">
              Open
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {isRenaming ? (
                <input
                  type="text"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  onBlur={submitRename}
                  onKeyDown={(e) => e.key === "Enter" && submitRename()}
                  className="w-full px-2 py-1 text-sm font-medium border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              ) : (
                <h3 className="font-medium text-gray-900 truncate text-sm">
                  {project.name}
                </h3>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Icon className="text-xs" />
                  {typeLabels[project.type]}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  {formatDate(project.updatedAt)}
                </span>
              </div>
            </div>

            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <BsThreeDotsVertical className="text-gray-400" />
              </button>
              {menuOpen === project.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                  <div className="absolute right-0 top-8 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20 min-w-[140px]">
                    <button
                      onClick={() => handleRename(project.id)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <BsPencil /> Rename
                    </button>
                    <button
                      onClick={() => handleDuplicate(project.id)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <BsFiles /> Duplicate
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                    >
                      <BsTrash /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>My Projects | tsarr.in</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/app" className="text-xl font-bold text-indigo-600">
                  tsarr.in
                </Link>
                <span className="text-gray-300">|</span>
                <h1 className="font-semibold text-gray-900">My Projects</h1>
              </div>

              <div className="flex items-center gap-3">
                {/* Storage indicator */}
                <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${storage.percentage}%` }}
                    />
                  </div>
                  <span>{formatBytes(storage.used)} used</span>
                </div>

                <Link
                  href="/app"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <BsPlus className="text-lg" />
                  New Design
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
          {/* Recent Projects */}
          {recentProjects.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <BsClock className="text-gray-400" />
                <h2 className="font-semibold text-gray-900">Recent</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {recentProjects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    onClick={() => openProject(project)}
                    className="flex-shrink-0 w-48 cursor-pointer group"
                  >
                    <div className="aspect-video bg-white rounded-lg border border-gray-200 overflow-hidden group-hover:shadow-md group-hover:border-gray-300 transition-all">
                      {project.thumbnail ? (
                        <img
                          src={project.thumbnail}
                          alt={project.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                          {(() => {
                            const Icon = typeIcons[project.type] || BsImage;
                            return <Icon className="text-2xl text-gray-300" />;
                          })()}
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-700 truncate">
                      {project.name}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* All Projects */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-semibold text-gray-900">All Projects</h2>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-48"
                  />
                </div>

                {/* Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Types</option>
                  <option value="screenshot">Screenshot</option>
                  <option value="code">Code</option>
                  <option value="tweet">Tweet</option>
                  <option value="carousel">Carousel</option>
                  <option value="polaroid">Polaroid</option>
                  <option value="text-behind-image">Text Behind</option>
                </select>

                {/* View toggle */}
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                  >
                    <BsGrid3X3Gap />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${viewMode === "list" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                  >
                    <BsList />
                  </button>
                </div>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="text-center py-16">
                <BsFolder2Open className="text-5xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {projects.length === 0 ? "No projects yet" : "No matching projects"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {projects.length === 0
                    ? "Create your first design to get started"
                    : "Try adjusting your search or filter"}
                </p>
                <Link
                  href="/app"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  <BsPlus className="text-lg" />
                  Create Design
                </Link>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {filteredProjects.map((project) => {
                  const Icon = typeIcons[project.type] || BsImage;
                  return (
                    <div
                      key={project.id}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => openProject(project)}
                    >
                      <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {project.thumbnail ? (
                          <img
                            src={project.thumbnail}
                            alt={project.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon className="text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {typeLabels[project.type]} • {formatDate(project.updatedAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(menuOpen === project.id ? null : project.id);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <BsThreeDotsVertical className="text-gray-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
