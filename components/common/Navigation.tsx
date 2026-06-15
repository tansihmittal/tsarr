import { useAuthContext } from "@/context/User";
import { BsPersonFillGear, BsGrid3X3Gap, BsFolder2, BsPerson, BsSun, BsMoon } from "react-icons/bs";
import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const Navigation: React.FC = () => {
  const [dark, setDark] = useState(false);
  const { currentUser, logout, openAuthModal, isLoading } = useAuthContext();

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.body.dataset.theme = next ? "dark" : "bumblebee";
  };

  return (
    <nav
      className="border-b h-[60px] sm:h-[70px] bg-white/95 backdrop-blur-lg border-[#E5E7EB] flex items-center mb-4 sticky top-0 z-50"
      style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      <div className="container mx-auto px-4 lg:px-0 flex items-center justify-between">
        <Link href="/" className="text-base font-semibold text-[#0A0A0A] hover:text-[#2563EB] transition-colors">
          tsarr.in
        </Link>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme"
            className="w-9 h-9 rounded-full">
            {dark ? <BsSun className="w-4 h-4" /> : <BsMoon className="w-4 h-4" />}
          </Button>

          {/* Projects */}
          <Button variant="ghost" size="icon" asChild className="w-9 h-9 rounded-full">
            <Link href="/projects" title="My Projects">
              <BsFolder2 className="w-4 h-4" />
            </Link>
          </Button>

          {/* Tools */}
          <Button variant="secondary" size="sm" asChild>
            <Link href="/tools">
              <BsGrid3X3Gap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tools</span>
            </Link>
          </Button>

          {/* Auth */}
          {!isLoading && (
            currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="gap-2">
                    {currentUser.photoUrl ? (
                      <img src={currentUser.photoUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <BsPersonFillGear className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline max-w-[80px] truncate">
                      {currentUser.displayName?.split(" ").map((w) => w[0]).join("") ||
                        currentUser.email?.split("@")[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="truncate max-w-[200px]">
                    {currentUser.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/projects">My Projects</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-[#EF4444] focus:text-[#EF4444]">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={openAuthModal}>
                <BsPerson className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
