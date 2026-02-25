
export interface Branch {
    id: string;
    name: string;
    address: string;
    lat: number;
    lon: number;
    radius: number; // meters - acceptable check-in radius
}

export const initialBranches: Branch[] = [
    {
        id: "1",
        name: "สำนักงานใหญ่ (กรุงเทพฯ)",
        address: "123 ถ.พระราม 9 กรุงเทพฯ 10320",
        lat: 13.756331,
        lon: 100.501762,
        radius: 200
    },
    {
        id: "2",
        name: "สาขาระยอง",
        address: "456 ถ.สุขุมวิท ระยอง 21000",
        lat: 12.683,
        lon: 101.261,
        radius: 300
    },
    {
        id: "3",
        name: "สาขาชลบุรี",
        address: "789 ถ.ศรีนครินทร์ ชลบุรี 20130",
        lat: 13.3611,
        lon: 100.9847,
        radius: 250
    },
];
