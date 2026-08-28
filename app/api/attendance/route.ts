import { NextResponse } from "next/server";

import { getAttendanceSummary, getDefaultAttendancePeriod } from "@/lib/attendance";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const defaultPeriod = await getDefaultAttendancePeriod();
    const year = Number(searchParams.get("year") ?? defaultPeriod.year);
    const month = Number(searchParams.get("month") ?? defaultPeriod.month);

    const data = await getAttendanceSummary(year, month);
    return NextResponse.json(data);
}
