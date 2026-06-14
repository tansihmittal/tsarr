import { useState } from "react";
import { BsX, BsEnvelopeFill, BsLockFill } from "react-icons/bs";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  loginWithGoogle: () => void;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
}

const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  loginWithGoogle,
  loginWithEmail,
  signUpWithEmail,
}) => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const busy = loading || googleLoading;

  const reset = () => {
    setEmail("");
    setPassword("");
    setError("");
    setLoading(false);
    setGoogleLoading(false);
  };

  const handleClose = () => {
    if (busy) return; // don't close mid-redirect
    reset();
    onClose();
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    // loginWithGoogle triggers a full-page redirect — page will leave, so no need to reset
    await loginWithGoogle();
    // Only reaches here if there was an error before redirect
    setGoogleLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signin") {
        await loginWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      reset();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Card */}
      <div className="relative bg-base-100 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Gradient strip */}
        <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500" />

        <div className="p-6">
          {/* Close */}
          {!googleLoading && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-base-200 transition-colors"
              aria-label="Close"
            >
              <BsX className="text-xl text-primary-content/60" />
            </button>
          )}

          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-2xl font-black tracking-tight text-primary-content">
              tsarr<span className="text-violet-500">.in</span>
            </span>
            <p className="text-sm text-primary-content/50 mt-1">
              {googleLoading
                ? "Redirecting to Google…"
                : mode === "signin"
                ? "Sign in to sync your projects across devices"
                : "Create a free account to back up your work"}
            </p>
          </div>

          {/* Google — shown prominently, or as a redirecting state */}
          <button
            onClick={handleGoogle}
            disabled={busy}
            className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all mb-4 ${
              googleLoading
                ? "bg-violet-600 text-white cursor-wait"
                : "border-2 border-base-200 hover:border-violet-300 hover:bg-violet-50 text-primary-content disabled:opacity-50"
            }`}
          >
            {googleLoading ? (
              <>
                {/* Spinner */}
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Redirecting to Google…
              </>
            ) : (
              <>
                {/* Google logo SVG */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Hide email form while redirecting */}
          {!googleLoading && (
            <>
              {/* Tab switcher */}
              <div className="flex bg-base-200 rounded-xl p-1 mb-4">
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(""); }}
                    disabled={busy}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                      mode === m
                        ? "bg-base-100 shadow-sm text-primary-content"
                        : "text-primary-content/50 hover:text-primary-content/80"
                    }`}
                  >
                    {m === "signin" ? "Sign In" : "Create Account"}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-base-200" />
                <span className="text-xs text-primary-content/30 uppercase tracking-wider">or with email</span>
                <div className="flex-1 h-px bg-base-200" />
              </div>

              {/* Email / Password */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <BsEnvelopeFill className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-content/30 text-sm" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    autoComplete="email"
                    disabled={busy}
                    className="w-full pl-10 pr-4 py-3 bg-base-200/50 border border-base-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 text-primary-content placeholder:text-primary-content/30 disabled:opacity-50"
                  />
                </div>
                <div className="relative">
                  <BsLockFill className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-content/30 text-sm" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Password (min 6 characters)" : "Password"}
                    required
                    minLength={6}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    disabled={busy}
                    className="w-full pl-10 pr-4 py-3 bg-base-200/50 border border-base-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 text-primary-content placeholder:text-primary-content/30 disabled:opacity-50"
                  />
                </div>

                {error && (
                  <div className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2.5">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {loading
                    ? "Please wait…"
                    : mode === "signin"
                    ? "Sign In"
                    : "Create Account"}
                </button>
              </form>

              {/* Guest CTA */}
              <button
                onClick={handleClose}
                className="w-full text-center text-xs text-primary-content/30 hover:text-primary-content/50 transition-colors mt-4 py-1"
              >
                Continue without an account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
