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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-[68px] px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = currentPath === item.href || 
            (item.href !== "/" && currentPath.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-xl transition-all active:scale-95 ${
                isActive 
                  ? "text-indigo-600 bg-indigo-50" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className={`text-[22px] mb-1 ${isActive ? "scale-110" : ""} transition-transform`} />
              <span className={`text-[11px] font-medium ${isActive ? "text-indigo-600" : "text-gray-500"}`}>
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
