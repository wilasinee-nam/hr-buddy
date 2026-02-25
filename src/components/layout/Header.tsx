"use client";

import { Bell, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface HeaderProps {
  title?: string;
  userName?: string;
  img?: string;
}

export function Header({ title = "HR System", userName = "สมชาย", img }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border-2 border-primary-foreground/20">
            <AvatarImage src={img} />
            <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs">
              {userName.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs opacity-80">สวัสดี</p>
            <p className="text-sm font-semibold">{userName}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link href="/organization/permissions">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
