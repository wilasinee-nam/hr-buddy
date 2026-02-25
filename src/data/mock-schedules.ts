
export interface WorkSchedule {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    lunchStart: string;
    lunchEnd: string;
    workDays: number[]; // 0 = Sunday, 1 = Monday, etc.
    isDefault: boolean;
}

export const initialSchedules: WorkSchedule[] = [
    {
        id: "1",
        name: "กะปกติ (Office)",
        startTime: "08:30",
        endTime: "17:30",
        lunchStart: "12:00",
        lunchEnd: "13:00",
        workDays: [1, 2, 3, 4, 5],
        isDefault: true
    },
    {
        id: "2",
        name: "กะเช้า (คลังสินค้า)",
        startTime: "06:00",
        endTime: "14:00",
        lunchStart: "10:00",
        lunchEnd: "10:30",
        workDays: [1, 2, 3, 4, 5, 6],
        isDefault: false
    },
    {
        id: "3",
        name: "กะบ่าย (คลังสินค้า)",
        startTime: "14:00",
        endTime: "22:00",
        lunchStart: "18:00",
        lunchEnd: "18:30",
        workDays: [1, 2, 3, 4, 5, 6],
        isDefault: false
    },
];
