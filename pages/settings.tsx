import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  BsArrowLeft, BsTrash, BsDownload, BsCloudUpload, BsShieldCheck,
  BsInfoCircle, BsGear, BsFolder2, BsImage, BsExclamationTriangle,
  BsCheckCircle, BsChevronRight, BsMoon, BsSun, BsBell, BsGlobe
} from "react-icons/bs";
import { toast } from "react-hot-toast";
import MobileNav from "@/components/common/MobileNav";
import { getProjects, clearAllProjects, Project } from "../utils/projectStorage";

interface StorageInfo {
  used: number;
  total: number;
  projectCount: number;
  imageCount: number;
}

export default function SettingsPage() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    used: 0,
    total: 0,
    projectCount: 0,
    imageCount: 0,
  });
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    calculateStorage();
  }, []);

  const calculateStorage = async () => {
    try {
      // Get projects count
      const projects = getProjects();
      
      // Estimate storage usage
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        setStorageInfo({
          used: estimate.usage || 0,
          total: estimate.quota || 0,
          projectCount: projects.length,
          imageCount: projects.filter(p => p.thumbnail).length,
        });
      } else {
        // Fallback estimation
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            totalSize += localStorage.getItem(key)?.length || 0;
          }
        }
        setStorageInfo({
          used: totalSize * 2, // UTF-16 encoding
          total: 5 * 1024 * 1024, // 5MB typical localStorage limit
          projectCount: projects.length,
          imageCount: projects.filter(p => p.thumbnail).length,
        });
      }
    } catch (error) {
      console.error("Error calculating storage:", error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStoragePercentage = () => {
    if (storageInfo.total === 0) return 0;
    return Math.min((storageInfo.used / storageInfo.total) * 100, 100);
  };

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      // Clear projects
      await clearAllProjects();
      
      // Clear localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("project-") || key.startsWith("tsarr-"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear IndexedDB if available
      if (window.indexedDB) {
        const databases = await window.indexedDB.databases?.() || [];
        for (const db of databases) {
          if (db.name && (db.name.includes("project") || db.name.includes("tsarr"))) {
            window.indexedDB.deleteDatabase(db.name);
          }
        }
      }

      toast.success("All data cleared successfully");
      setShowClearConfirm(false);
      calculateStorage();
    } catch (error) {
      toast.error("Failed to clear data");
      console.error(error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportData = async () => {
    try {
      const projects = getProjects();
      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        projects,
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tsarr-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("Data exported successfully");
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  const storagePercentage = getStoragePercentage();
  const storageColor = storagePercentage > 80 ? "bg-red-500" : storagePercentage > 50 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <>
      <Head>
        <title>Settings | tsarr.in</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-lg border-b border-gray-200/80 sticky top-0 z-50">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
            <Link href="/app" className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
              <BsArrowLeft className="text-lg" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Storage Section */}
          <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <BsFolder2 className="text-indigo-600 text-lg" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Storage</h2>
                  <p className="text-sm text-gray-500">Manage your local data</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Storage Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Used Space</span>
                  <span className="font-medium text-gray-900">
                    {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.total)}
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${storageColor} rounded-full transition-all duration-500`}
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  {storagePercentage.toFixed(1)}% used
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <BsFolder2 className="text-sm" />
                    <span className="text-xs">Projects</span>
                  </div>
                  <p className="text-xl font-semibold text-gray-900">{storageInfo.projectCount}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <BsImage className="text-sm" />
                    <span className="text-xs">With Thumbnails</span>
                  </div>
                  <p className="text-xl font-semibold text-gray-900">{storageInfo.imageCount}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Management */}
          <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <BsGear className="text-emerald-600 text-lg" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Data Management</h2>
                  <p className="text-sm text-gray-500">Export or clear your data</p>
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              <button
                onClick={handleExportData}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors active:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <BsDownload className="text-gray-500 text-lg" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Export Data</p>
                    <p className="text-sm text-gray-500">Download all projects as JSON</p>
                  </div>
                </div>
                <BsChevronRight className="text-gray-400" />
              </button>

              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors active:bg-red-100"
              >
                <div className="flex items-center gap-3">
                  <BsTrash className="text-red-500 text-lg" />
                  <div className="text-left">
                    <p className="font-medium text-red-600">Clear All Data</p>
                    <p className="text-sm text-gray-500">Delete all projects and cached data</p>
                  </div>
                </div>
                <BsChevronRight className="text-gray-400" />
              </button>
            </div>
          </section>

          {/* About Section */}
          <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BsInfoCircle className="text-blue-600 text-lg" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">About</h2>
                  <p className="text-sm text-gray-500">App information</p>
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              <div className="p-4 flex items-center justify-between">
                <span className="text-gray-600">Version</span>
                <span className="font-medium text-gray-900">1.0.0</span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="text-gray-600">Data Storage</span>
                <span className="font-medium text-gray-900">Local Only</span>
              </div>
              <Link
                href="/"
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-600">Visit Website</span>
                <BsChevronRight className="text-gray-400" />
              </Link>
            </div>
          </section>

          {/* Privacy Note */}
          <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <BsShieldCheck className="text-emerald-600 text-lg flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-800 text-sm">Your data stays private</p>
              <p className="text-sm text-emerald-700 mt-0.5">
                All projects are stored locally on your device. Nothing is uploaded to any server.
              </p>
            </div>
          </div>
        </main>

        {/* Mobile Navigation */}
        <MobileNav />

        {/* Clear Data Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BsExclamationTriangle className="text-red-600 text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Clear All Data?
              </h3>
              <p className="text-gray-500 text-center text-sm mb-6">
                This will permanently delete all your projects and cached data. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  disabled={isClearing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAllData}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={isClearing}
                >
                  {isClearing ? "Clearing..." : "Clear All"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
