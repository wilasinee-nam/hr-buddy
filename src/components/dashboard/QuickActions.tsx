import { Clock, CalendarPlus, BarChart3, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const actions = [
  {
    to: "/attendance",
    icon: Clock,
    label: "เช็คอิน",
    description: "ลงเวลาเข้างาน",
    variant: "primary" as const,
  },
  {
    to: "/leave/request",
    icon: CalendarPlus,
    label: "ขอลา",
    description: "ยื่นใบลางาน",
    variant: "secondary" as const,
  },
  {
    to: "/leave/approval",
    icon: ClipboardCheck,
    label: "อนุมัติลา",
    description: "รายการรออนุมัติ",
    variant: "secondary" as const,
  },
  {
    to: "/reports",
    icon: BarChart3,
    label: "รายงาน",
    description: "ภาพรวมบุคลากร",
    variant: "secondary" as const,
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => (
        <Link
          key={action.to}
          href={action.to}
          className={cn(
            "flex flex-col items-center justify-center p-4 rounded-xl transition-all active:scale-95",
            action.variant === "primary"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              : "bg-card border border-border hover:border-primary/30 hover:shadow-md"
          )}
        >
          <action.icon
            className={cn(
              "h-8 w-8 mb-2",
              action.variant === "primary" ? "text-primary-foreground" : "text-primary"
            )}
          />
          <span
            className={cn(
              "text-sm font-semibold",
              action.variant === "primary" ? "text-primary-foreground" : "text-foreground"
            )}
          >
            {action.label}
          </span>
          <span
            className={cn(
              "text-[10px]",
              action.variant === "primary" ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {action.description}
          </span>
        </Link>
      ))}
    </div>
  );
}
