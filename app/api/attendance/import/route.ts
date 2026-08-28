import { NextResponse } from "next/server";

import { importAttendanceFile } from "@/lib/attendance";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");
        const year = Number(formData.get("year") ?? 0);
        const month = Number(formData.get("month") ?? 0);

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "No CSV/XLS file was uploaded." }, { status: 400 });
        }

        if (!file.name.toLowerCase().endsWith(".csv") && !file.name.toLowerCase().endsWith(".xlsx") && !file.name.toLowerCase().endsWith(".xls")) {
            return NextResponse.json({ error: "Only CSV or Excel files are supported." }, { status: 400 });
        }

        const result = await importAttendanceFile(file, year, month);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Attendance import failed." },
            { status: 400 },
        );
    }
}
