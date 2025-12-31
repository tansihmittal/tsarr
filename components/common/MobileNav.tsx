import Link from "next/link";
import { useRouter } from "next/router";
import { BsHouseDoor, BsGrid3X3Gap, BsPencilSquare, BsCode } from "react-icons/bs";

const MobileNav = () => {
  const router = useRouter();
  const currentPath = router.pathname;

  const navItems = [
    { href: "/app", icon: BsHouseDoor, label: "Home" },
    { href: "/tools", icon: BsGrid3X3Gap, label: "Tools" },
    { href: "/editor", icon: BsPencilSquare, label: "Editor" },
    { href: "/code", icon: BsCode, label: "Code" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.href || 
            (item.href !== "/" && currentPath.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive 
                  ? "text-indigo-600" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className={`text-xl mb-1 ${isActive ? "scale-110" : ""} transition-transform`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
