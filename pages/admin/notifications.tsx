import Head from "next/head";
import { useState, useEffect } from "react";
import { BsBell, BsSend, BsPeople, BsLock, BsCheckCircle, BsXCircle } from "react-icons/bs";
import { toast, Toaster } from "react-hot-toast";

export default function AdminNotifications() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/app");
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  // Check if already authenticated (stored in sessionStorage)
  useEffect(() => {
    const storedKey = sessionStorage.getItem("admin_api_key");
    if (storedKey) {
      setApiKey(storedKey);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Store the password as the API key
    sessionStorage.setItem("admin_api_key", password);
    setApiKey(password);
    setIsAuthenticated(true);
    toast.success("Logged in!");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_api_key");
    setApiKey("");
    setIsAuthenticated(false);
    setPassword("");
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSending(true);
    setLastResult(null);

    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || "/app",
        }),
      });

      const result = await response.json();
      setLastResult(result);

      if (!response.ok) {
        toast.error(result.error || "Failed to send");
        if (response.status === 401) {
          handleLogout();
        }
      } else if (result.success) {
        toast.success(
          result.totalSubscribers 
            ? `Sent to ${result.successCount}/${result.totalSubscribers} subscribers!`
            : result.message || "Sent!"
        );
        // Clear form on success
        setTitle("");
        setBody("");
        setUrl("/app");
      }
    } catch (error) {
      toast.error("Network error");
      setLastResult({ error: "Network error" });
    } finally {
      setIsSending(false);
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Admin Login | tsarr.in</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <Toaster position="top-center" />
        
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BsLock className="text-indigo-600 text-2xl" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 text-center mb-2">Admin Access</h1>
            <p className="text-gray-500 text-center text-sm mb-6">Enter your API key to continue</p>
            
            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="API Key"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
                autoFocus
              />
              <button
                type="submit"
                disabled={!password.trim()}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  // Admin dashboard
  return (
    <>
      <Head>
        <title>Send Notifications | Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Toaster position="top-center" />

      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <BsBell className="text-indigo-600 text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Push Notifications</h1>
                <p className="text-sm text-gray-500">Send to all subscribers</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSend} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="New Feature! 🎉"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Check out our latest tools and features..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Link URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/app"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">Where users go when they tap the notification</p>
            </div>

            <button
              type="submit"
              disabled={isSending || !title.trim()}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <BsSend />
                  Send Notification
                </>
              )}
            </button>
          </form>

          {/* Result */}
          {lastResult && (
            <div className={`mt-4 p-4 rounded-xl ${lastResult.error ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
              <div className="flex items-start gap-3">
                {lastResult.error ? (
                  <BsXCircle className="text-red-500 text-lg flex-shrink-0 mt-0.5" />
                ) : (
                  <BsCheckCircle className="text-emerald-500 text-lg flex-shrink-0 mt-0.5" />
                )}
                <div className="text-sm">
                  {lastResult.error ? (
                    <p className="text-red-700">{lastResult.error}</p>
                  ) : (
                    <>
                      <p className="font-medium text-emerald-800">
                        {lastResult.message || `Sent successfully!`}
                      </p>
                      {lastResult.totalSubscribers !== undefined && (
                        <p className="text-emerald-700 mt-1">
                          <BsPeople className="inline mr-1" />
                          {lastResult.successCount}/{lastResult.totalSubscribers} delivered
                          {lastResult.failureCount > 0 && `, ${lastResult.failureCount} failed`}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick templates */}
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick Templates</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { title: "Time to create! ✨", body: "Your next design is waiting" },
                { title: "New Feature! 🎉", body: "Check out what's new" },
                { title: "Design tip 💡", body: "Try our latest tools" },
                { title: "Don't forget! 📱", body: "You have unsaved projects" },
              ].map((template, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setTitle(template.title);
                    setBody(template.body);
                  }}
                  className="p-3 text-left bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <p className="font-medium text-gray-900 text-sm truncate">{template.title}</p>
                  <p className="text-xs text-gray-500 truncate">{template.body}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
