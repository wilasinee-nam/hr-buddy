import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, CalendarX, Clock, AlertTriangle } from "lucide-react";

interface StatsItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

function StatsItem({ icon: Icon, label, value, color, bgColor }: StatsItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${bgColor}`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value} วัน</p>
      </div>
    </div>
  );
}

interface MonthlyStatsProps {
  workDays: number;
  leaveDays: number;
  lateDays: number;
  absentDays: number;
}

export function MonthlyStats({ 
  workDays = 20, 
  leaveDays = 1, 
  lateDays = 2, 
  absentDays = 0 
}: MonthlyStatsProps) {
  const currentMonth = new Date().toLocaleDateString("th-TH", { month: "long" });

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">
          สรุปประจำเดือน{currentMonth}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <StatsItem
          icon={CalendarCheck}
          label="มาทำงาน"
          value={workDays}
          color="text-success"
          bgColor="bg-success/10"
        />
        <StatsItem
          icon={CalendarX}
          label="ลางาน"
          value={leaveDays}
          color="text-info"
          bgColor="bg-info/10"
        />
        <StatsItem
          icon={Clock}
          label="มาสาย"
          value={lateDays}
          color="text-warning"
          bgColor="bg-warning/10"
        />
        <StatsItem
          icon={AlertTriangle}
          label="ขาดงาน"
          value={absentDays}
          color="text-destructive"
          bgColor="bg-destructive/10"
        />
      </CardContent>
    </Card>
  );
}
