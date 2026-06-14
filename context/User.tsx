import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";
import { UserAuthProps, UserDetails } from "@/interface";
import { toast } from "react-hot-toast";
import AuthModal from "@/components/common/AuthModal";

const AuthContext = createContext<UserAuthProps>({
  currentUser: null,
  isLoading: true,
  loginWithGoogle: () => {},
  loginWithEmail: async () => {},
  signUpWithEmail: async () => {},
  loginWithMagicLink: async () => {},
  logout: () => {},
  openAuthModal: () => {},
});

const mapSupabaseUser = (user: User): UserDetails => ({
  uid: user.id,
  email: user.email,
  displayName:
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    null,
  photoUrl: user.user_metadata?.avatar_url || null,
});

const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    // Hydrate from existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
      setIsLoading(false);
    });

    // Listen for auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const mappedUser = session?.user ? mapSupabaseUser(session.user) : null;
      setUser(mappedUser);
      setIsLoading(false);

      // Welcome toast only on an actual new sign-in, not session restoration at page load
      if (event === "SIGNED_IN" && mappedUser) {
        const firstName = mappedUser.displayName?.split(" ")[0] || mappedUser.email?.split("@")[0];
        toast.success(`Welcome${firstName ? `, ${firstName}` : ""}!`);
        setAuthModalOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      // Redirect back to the exact page the user was on (strip fragment to avoid double-hash)
      const returnTo =
        typeof window !== "undefined"
          ? window.location.origin + window.location.pathname + window.location.search
          : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: returnTo },
      });
      if (error) throw error;
    } catch {
      toast.error("Google sign-in failed");
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    toast.success("Signed in!");
    setAuthModalOpen(false);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    toast.success("Account created! Check your email to verify.");
    setAuthModalOpen(false);
  };

  const loginWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    toast.success("Magic link sent! Check your inbox.");
    setAuthModalOpen(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success("Logged out");
  };

  const openAuthModal = () => setAuthModalOpen(true);

  return (
    <AuthContext.Provider
      value={{
        currentUser: user,
        isLoading,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        loginWithMagicLink,
        logout,
        openAuthModal,
      }}
    >
      {children}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        loginWithGoogle={loginWithGoogle}
        loginWithEmail={loginWithEmail}
        signUpWithEmail={signUpWithEmail}
      />
    </AuthContext.Provider>
  );
};

const useAuthContext = () => useContext(AuthContext);

export { AuthContextProvider, useAuthContext };
