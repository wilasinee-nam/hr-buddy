"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, CheckCircle2, Navigation, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Branch, initialBranches } from "@/data/mock-branches";

// Mock current user's assigned branch
const currentUserBranchId = "1";

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}

export default function AttendancePage() {
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [checkInTime, setCheckInTime] = useState<string | null>(null);
    const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [branches] = useState<Branch[]>(initialBranches);

    // Get user's assigned branch
    const assignedBranch = branches.find(b => b.id === currentUserBranchId);

    // Get current location
    useEffect(() => {
        if (typeof window !== "undefined" && navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const newLoc = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                    };
                    setCurrentLocation(newLoc);
                    setLocationError(null);

                    // Calculate distance to assigned branch
                    if (assignedBranch) {
                        const dist = calculateDistance(
                            newLoc.lat, newLoc.lon,
                            assignedBranch.lat, assignedBranch.lon
                        );
                        setDistance(Math.round(dist));
                    }
                },
                (error) => {
                    setLocationError("ไม่สามารถระบุตำแหน่งได้ กรุณาเปิด GPS");
                },
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        } else if (typeof window !== "undefined") {
            setLocationError("เบราว์เซอร์ไม่รองรับ GPS");
        }
    }, [assignedBranch]);

    const getCurrentTime = () => {
        return new Date().toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const isWithinRange = distance !== null && assignedBranch && distance <= assignedBranch.radius;

    const handleCheckIn = () => {
        if (!currentLocation) {
            toast.error("กรุณารอระบบระบุตำแหน่งก่อน");
            return;
        }

        const time = getCurrentTime();
        setCheckInTime(time);
        setIsCheckedIn(true);

        if (isWithinRange) {
            toast.success(`เช็คอินสำเร็จ เวลา ${time} (ระยะห่าง ${distance} ม.)`);
        } else {
            toast.warning(`เช็คอินสำเร็จ เวลา ${time} (ระยะห่าง ${distance} ม. - นอกพื้นที่)`);
        }
    };

    const handleCheckOut = () => {
        const time = getCurrentTime();
        setCheckOutTime(time);

        if (isWithinRange) {
            toast.success(`เช็คเอาท์สำเร็จ เวลา ${time} (ระยะห่าง ${distance} ม.)`);
        } else {
            toast.warning(`เช็คเอาท์สำเร็จ เวลา ${time} (ระยะห่าง ${distance} ม. - นอกพื้นที่)`);
        }
    };

    const today = new Date().toLocaleDateString("th-TH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const getDistanceColor = () => {
        if (distance === null) return "text-muted-foreground";
        if (isWithinRange) return "text-success";
        return "text-destructive";
    };

    const getDistanceBadgeVariant = () => {
        if (distance === null) return "secondary";
        if (isWithinRange) return "default";
        return "destructive";
    };

    return (
        <div className="p-4 space-y-6">
            {/* Date Display */}
            <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">วันนี้</p>
                <p className="text-lg font-semibold text-foreground">{today}</p>
            </div>

            {/* Clock Display */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-primary to-primary/80">
                <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-primary-foreground/80" />
                    <p className="text-5xl font-bold text-primary-foreground mb-2">
                        {getCurrentTime()}
                    </p>
                    <div className="flex items-center justify-center gap-1 text-primary-foreground/70">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="text-xs">{assignedBranch?.name || "SySmile"}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Location Info */}
            <Card className="border-none shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">ตำแหน่งปัจจุบัน</span>
                        </div>
                        {distance !== null && (
                            <Badge variant={getDistanceBadgeVariant() as "default" | "secondary" | "destructive"} className="text-xs">
                                {isWithinRange ? "ในพื้นที่" : "นอกพื้นที่"}
                            </Badge>
                        )}
                    </div>

                    {locationError ? (
                        <div className="flex items-center gap-2 text-destructive text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{locationError}</span>
                        </div>
                    ) : currentLocation ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">สาขาที่ประจำ</p>
                                    <p className="text-sm font-medium">{assignedBranch?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">ระยะห่าง</p>
                                    <p className={`text-lg font-bold ${getDistanceColor()}`}>
                                        {distance !== null ? (
                                            distance > 1000
                                                ? `${(distance / 1000).toFixed(1)} กม.`
                                                : `${distance} ม.`
                                        ) : "กำลังคำนวณ..."}
                                    </p>
                                </div>
                            </div>
                            {assignedBranch && (
                                <p className="text-xs text-muted-foreground text-center">
                                    รัศมีเช็คอินที่อนุญาต: {assignedBranch.radius} เมตร
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">กำลังระบุตำแหน่ง...</p>
                    )}
                </CardContent>
            </Card>

            {/* Main Check In/Out Button */}
            <div className="flex flex-col items-center justify-center py-6">
                {!checkOutTime ? (
                    <Button
                        onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
                        size="lg"
                        disabled={!currentLocation}
                        className={`w-40 h-40 rounded-full flex-col gap-3 text-xl font-bold shadow-2xl transition-all duration-300 ${isCheckedIn
                            ? "bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                            : "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                            }`}
                    >
                        <Clock className="h-12 w-12" />
                        <span>{isCheckedIn ? "เช็คเอาท์" : "เช็คอิน"}</span>
                    </Button>
                ) : (
                    <div className="w-40 h-40 rounded-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-success/20 to-success/10 border-4 border-success">
                        <CheckCircle2 className="h-12 w-12 text-success" />
                        <span className="text-lg font-bold text-success">เสร็จสิ้น</span>
                    </div>
                )}

                {/* Time badges */}
                <div className="flex gap-4 mt-6">
                    {checkInTime && (
                        <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm font-medium">เข้า {checkInTime}</span>
                        </div>
                    )}
                    {checkOutTime && (
                        <div className="flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm font-medium">ออก {checkOutTime}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Time Summary */}
            <Card className="border-none shadow-sm">
                <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">สรุปวันนี้</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-secondary/50 rounded-lg p-3">
                            <p className="text-[10px] text-muted-foreground">เข้างาน</p>
                            <p className="text-lg font-bold text-foreground">{checkInTime || "--:--"}</p>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-3">
                            <p className="text-[10px] text-muted-foreground">เลิกงาน</p>
                            <p className="text-lg font-bold text-foreground">{checkOutTime || "--:--"}</p>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-3">
                            <p className="text-[10px] text-muted-foreground">ชั่วโมงทำงาน</p>
                            <p className="text-lg font-bold text-foreground">
                                {checkInTime && checkOutTime ? "8:00" : "--:--"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
