import Link from "next/link";
import { useRouter } from "next/router";
import { BsHouseDoor, BsGrid3X3Gap, BsFolder2, BsGear } from "react-icons/bs";

const MobileNav = () => {
  const router = useRouter();
  const currentPath = router.pathname;

  const navItems = [
    { href: "/app", icon: BsHouseDoor, label: "Home" },
    { href: "/projects", icon: BsFolder2, label: "Projects" },
    { href: "/tools", icon: BsGrid3X3Gap, label: "Tools" },
    { href: "/settings", icon: BsGear, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-[#E5E7EB]/8 dark:border-gray-700/80 dark:border-gray-700/80 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-[68px] px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = currentPath === item.href ||
            (item.href !== "/" && currentPath.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-[14px] transition-all active:scale-95 ${
                isActive
                  ? "text-[#2563EB] bg-[#EFF6FF] dark:bg-blue-900/20 dark:text-blue-400 dark:bg-blue-900/30"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 hover:bg-[#F9FAFB] dark:hover:bg-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              <Icon className={`text-[22px] mb-1 ${isActive ? "scale-110" : ""} transition-transform`} />
              <span className={`text-[11px] font-medium ${isActive ? "text-[#2563EB] dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
