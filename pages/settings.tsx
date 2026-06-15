import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  BsArrowLeft, BsTrash, BsDownload, BsCloudUpload, BsShieldCheck,
  BsInfoCircle, BsGear, BsFolder2, BsImage, BsExclamationTriangle,
  BsCheckCircle, BsChevronRight, BsMoon, BsSun, BsBell, BsGlobe, BsBellSlash
} from "react-icons/bs";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

import { getProjects, clearAllProjects, Project } from "../utils/projectStorage";
import {
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermission,
  showLocalNotification,
  getRandomReminder,
  initFirebaseMessaging
} from "../utils/notifications";

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
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [notificationsSupported, setNotificationsSupported] = useState(false);

  useEffect(() => {
    calculateStorage();
    // Check notification support
    setNotificationsSupported(isNotificationSupported());
    setNotificationPermission(getNotificationPermission());
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

      <div className="min-h-screen bg-[#F9FAFB] pb-24 lg:pb-8" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-lg border-b border-[#E5E7EB]/80 sticky top-0 z-50">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
            <Link href="/app" className="p-2 -ml-2 text-[#4B5563] hover:text-[#0A0A0A] hover:bg-gray-100 rounded-[14px] transition-colors">
              <BsArrowLeft className="text-lg" />
            </Link>
            <h1 className="text-lg font-semibold text-[#0A0A0A]">Settings</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Storage Section */}
          <section className="bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-[14px] flex items-center justify-center">
                  <BsFolder2 className="text-[#2563EB] text-lg" />
                </div>
                <div>
                  <h2 className="font-semibold text-[#0A0A0A]">Storage</h2>
                  <p className="text-sm text-[#4B5563]">Manage your local data</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Storage Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#4B5563]">Used Space</span>
                  <span className="font-medium text-[#0A0A0A]">
                    {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.total)}
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${storageColor} rounded-full transition-all duration-500`}
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>
                <p className="text-xs text-[#4B5563] mt-1.5">
                  {storagePercentage.toFixed(1)}% used
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#F9FAFB] rounded-[14px]">
                  <div className="flex items-center gap-2 text-[#4B5563] mb-1">
                    <BsFolder2 className="text-sm" />
                    <span className="text-xs">Projects</span>
                  </div>
                  <p className="text-xl font-semibold text-[#0A0A0A]">{storageInfo.projectCount}</p>
                </div>
                <div className="p-3 bg-[#F9FAFB] rounded-[14px]">
                  <div className="flex items-center gap-2 text-[#4B5563] mb-1">
                    <BsImage className="text-sm" />
                    <span className="text-xs">With Thumbnails</span>
                  </div>
                  <p className="text-xl font-semibold text-[#0A0A0A]">{storageInfo.imageCount}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Management */}
          <section className="bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-[14px] flex items-center justify-center">
                  <BsGear className="text-emerald-600 text-lg" />
                </div>
                <div>
                  <h2 className="font-semibold text-[#0A0A0A]">Data Management</h2>
                  <p className="text-sm text-[#4B5563]">Export or clear your data</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              <button
                onClick={handleExportData}
                className="w-full p-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors active:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <BsDownload className="text-[#4B5563] text-lg" />
                  <div className="text-left">
                    <p className="font-medium text-[#0A0A0A]">Export Data</p>
                    <p className="text-sm text-[#4B5563]">Download all projects as JSON</p>
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
                    <p className="text-sm text-[#4B5563]">Delete all projects and cached data</p>
                  </div>
                </div>
                <BsChevronRight className="text-gray-400" />
              </button>
            </div>
          </section>

          {/* Notifications Section */}
          {notificationsSupported && (
            <section className="bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-[14px] flex items-center justify-center">
                    <BsBell className="text-amber-600 text-lg" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[#0A0A0A]">Notifications</h2>
                    <p className="text-sm text-[#4B5563]">Get creative reminders</p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {notificationPermission === 'granted' ? (
                      <BsBell className="text-emerald-500 text-lg" />
                    ) : (
                      <BsBellSlash className="text-gray-400 text-lg" />
                    )}
                    <div>
                      <p className="font-medium text-[#0A0A0A]">Push Notifications</p>
                      <p className="text-sm text-[#4B5563]">
                        {notificationPermission === 'granted'
                          ? "Enabled - you'll receive creative reminders"
                          : notificationPermission === 'denied'
                          ? 'Blocked - enable in browser settings'
                          : 'Get reminders to create designs'}
                      </p>
                    </div>
                  </div>
                  {notificationPermission !== 'denied' && (
                    <Button
                      size="sm"
                      variant={notificationPermission === 'granted' ? 'secondary' : 'default'}
                      onClick={async () => {
                        const granted = await requestNotificationPermission();
                        setNotificationPermission(granted ? 'granted' : 'denied');
                        if (granted) {
                          // Initialize FCM and register token
                          const token = await initFirebaseMessaging();
                          if (token) {
                            toast.success('Notifications enabled!');
                          } else {
                            toast.success('Notifications enabled (local only)');
                          }
                        }
                      }}
                      className={notificationPermission === 'granted' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' : ''}
                    >
                      {notificationPermission === 'granted' ? 'Enabled' : 'Enable'}
                    </Button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* About Section */}
          <section className="bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-[14px] flex items-center justify-center">
                  <BsInfoCircle className="text-[#2563EB] text-lg" />
                </div>
                <div>
                  <h2 className="font-semibold text-[#0A0A0A]">About</h2>
                  <p className="text-sm text-[#4B5563]">App information</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              <div className="p-4 flex items-center justify-between">
                <span className="text-[#4B5563]">Version</span>
                <span className="font-medium text-[#0A0A0A]">1.0.0</span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="text-[#4B5563]">Data Storage</span>
                <span className="font-medium text-[#0A0A0A]">Local Only</span>
              </div>
              <Link
                href="/"
                className="p-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors"
              >
                <span className="text-[#4B5563]">Visit Website</span>
                <BsChevronRight className="text-gray-400" />
              </Link>
            </div>
          </section>

          {/* Privacy Note */}
          <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-[14px] border border-emerald-200">
            <BsShieldCheck className="text-emerald-600 text-lg flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-800 text-sm">Your data stays private</p>
              <p className="text-sm text-emerald-700 mt-0.5">
                All projects are stored locally on your device. Nothing is uploaded to any server.
              </p>
            </div>
          </div>
        </main>

        {/* Clear Data Confirmation Modal */}
        <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
          <DialogContent className="max-w-sm rounded-[20px] p-6">
            <DialogHeader className="items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BsExclamationTriangle className="text-red-600 text-2xl" />
              </div>
              <DialogTitle className="text-lg font-semibold text-[#0A0A0A]">
                Clear All Data?
              </DialogTitle>
              <DialogDescription className="text-[#4B5563] text-sm mt-2">
                This will permanently delete all your projects and cached data. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-3 mt-6 sm:flex-row">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleClearAllData}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={isClearing}
              >
                {isClearing ? "Clearing..." : "Clear All"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
