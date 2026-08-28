import { NextResponse } from "next/server";

import { getAttendanceTemplateCsv } from "@/lib/attendance";

export async function GET() {
    const csv = await getAttendanceTemplateCsv();

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="attendance-template.csv"',
        },
    });
}
