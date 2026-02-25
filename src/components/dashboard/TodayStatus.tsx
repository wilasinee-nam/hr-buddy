import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TodayStatusProps {
  checkInTime?: string;
  checkOutTime?: string;
  status: "not_checked" | "checked_in" | "checked_out";
}

export function TodayStatus({ 
  checkInTime, 
  checkOutTime, 
  status = "not_checked" 
}: TodayStatusProps) {
  const today = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const getStatusInfo = () => {
    switch (status) {
      case "checked_in":
        return {
          icon: Clock,
          text: "กำลังทำงาน",
          color: "text-success",
          bgColor: "bg-success/10",
        };
      case "checked_out":
        return {
          icon: CheckCircle2,
          text: "เสร็จสิ้นแล้ว",
          color: "text-success",
          bgColor: "bg-success/10",
        };
      default:
        return {
          icon: XCircle,
          text: "ยังไม่ได้เช็คอิน",
          color: "text-muted-foreground",
          bgColor: "bg-muted",
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="border-none shadow-sm bg-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground">วันนี้</p>
            <p className="text-sm font-medium text-foreground">{today}</p>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusInfo.bgColor}`}>
            <StatusIcon className={`h-3.5 w-3.5 ${statusInfo.color}`} />
            <span className={`text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">เข้างาน</p>
            <p className="text-lg font-bold text-foreground">
              {checkInTime || "--:--"}
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">เลิกงาน</p>
            <p className="text-lg font-bold text-foreground">
              {checkOutTime || "--:--"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
