import { NextResponse } from "next/server";

import { getEmployeeAttendanceDetail } from "@/lib/attendance";

export async function GET(_request: Request, { params }: { params: Promise<{ employeeId: string }> }) {
    const { employeeId } = await params;

    try {
        const data = await getEmployeeAttendanceDetail(employeeId);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unable to load attendance detail." },
            { status: 400 },
        );
    }
}
