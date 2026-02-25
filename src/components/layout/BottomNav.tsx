"use client";

import { Home, Clock, CalendarDays, Users, Building2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

const navItems = [
  { to: "/home", icon: Home, label: "หน้าหลัก" },
  { to: "/attendance", icon: Clock, label: "เช็คอิน" },
  { to: "/leave", icon: CalendarDays, label: "ลางาน" },
  { to: "/employees", icon: Users, label: "พนักงาน" },
  { to: "/organization", icon: Building2, label: "องค์กร" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  const handleNavClick = (href: string) => {
    if (pathname !== href) {
      setIsLoading(true);
    }
  };

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-[35] bg-background/80 backdrop-blur-sm">
          <LoadingScreen />
        </div>
      )}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            return (
              <NavLink
                key={item.to}
                href={item.to}
                onClick={() => handleNavClick(item.to)}
                className="flex flex-col items-center justify-center gap-0.5 px-1.5 py-1.5 text-muted-foreground transition-colors hover:text-primary"
                activeClassName="text-primary"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[9px] font-medium">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </>
  );
}
