import { NextResponse } from "next/server";

import { getAttendanceSummary, getDefaultAttendancePeriod } from "@/lib/attendance";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get("year") ?? getDefaultAttendancePeriod().year);
    const month = Number(searchParams.get("month") ?? getDefaultAttendancePeriod().month);

    const data = await getAttendanceSummary(year, month);
    return NextResponse.json(data);
}
