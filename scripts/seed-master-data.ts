import "dotenv/config";

import { eq } from "drizzle-orm";

import { db } from "../lib/db";
import { department, district, jobPosition, province, regency } from "../lib/schema";

const provinces = [
    { code: "ID-11", name: "Aceh" },
    { code: "ID-31", name: "DKI Jakarta" },
    { code: "ID-32", name: "Jawa Barat" },
    { code: "ID-33", name: "Jawa Tengah" },
    { code: "ID-34", name: "Jawa Timur" },
];

const regenciesByProvince: Record<string, Array<{ code: string; name: string }>> = {
    "Aceh": [
        { code: "ID-11-01", name: "Banda Aceh" },
        { code: "ID-11-02", name: "Aceh Besar" },
    ],
    "DKI Jakarta": [
        { code: "ID-31-01", name: "Jakarta Pusat" },
        { code: "ID-31-02", name: "Jakarta Barat" },
    ],
    "Jawa Barat": [
        { code: "ID-32-01", name: "Bandung" },
        { code: "ID-32-02", name: "Bogor" },
    ],
    "Jawa Tengah": [
        { code: "ID-33-01", name: "Semarang" },
        { code: "ID-33-02", name: "Solo" },
    ],
    "Jawa Timur": [
        { code: "ID-34-01", name: "Surabaya" },
        { code: "ID-34-02", name: "Malang" },
    ],
};

const districtsByRegency: Record<string, Array<{ code: string; name: string }>> = {
    "Banda Aceh": [
        { code: "ID-11-01-01", name: "Kuta Alam" },
        { code: "ID-11-01-02", name: "Syiah Kuala" },
    ],
    "Aceh Besar": [
        { code: "ID-11-02-01", name: "Lhoong" },
        { code: "ID-11-02-02", name: "Blang Bintang" },
    ],
    "Jakarta Pusat": [
        { code: "ID-31-01-01", name: "Menteng" },
        { code: "ID-31-01-02", name: "Tanah Abang" },
    ],
    "Jakarta Barat": [
        { code: "ID-31-02-01", name: "Grogol Petamburan" },
        { code: "ID-31-02-02", name: "Tambora" },
    ],
    "Bandung": [
        { code: "ID-32-01-01", name: "Bandung Kulon" },
        { code: "ID-32-01-02", name: "Bandung Wetan" },
    ],
    "Bogor": [
        { code: "ID-32-02-01", name: "Bogor Selatan" },
        { code: "ID-32-02-02", name: "Bogor Timur" },
    ],
    "Semarang": [
        { code: "ID-33-01-01", name: "Semarang Tengah" },
        { code: "ID-33-01-02", name: "Semarang Selatan" },
    ],
    "Solo": [
        { code: "ID-33-02-01", name: "Laweyan" },
        { code: "ID-33-02-02", name: "Serengan" },
    ],
    "Surabaya": [
        { code: "ID-34-01-01", name: "Wonokromo" },
        { code: "ID-34-01-02", name: "Tegalsari" },
    ],
    "Malang": [
        { code: "ID-34-02-01", name: "Klojen" },
        { code: "ID-34-02-02", name: "Lowokwaru" },
    ],
};

const departments = [
    { code: "HR", name: "Human Resources" },
    { code: "FIN", name: "Finance" },
    { code: "OPS", name: "Operations" },
    { code: "IT", name: "Information Technology" },
    { code: "SALES", name: "Sales" },
];

const jobPositions = [
    { code: "STAFF", name: "Staff", department: "Operations" },
    { code: "SUPV", name: "Supervisor", department: "Operations" },
    { code: "ENG", name: "Engineer", department: "Information Technology" },
    { code: "ANL", name: "Analyst", department: "Finance" },
    { code: "MGR", name: "Manager", department: "Human Resources" },
    { code: "EXEC", name: "Executive", department: "Sales" },
];

async function ensureProvince() {
    const inserted: Record<string, string> = {};

    for (const provinceSeed of provinces) {
        const existing = await db
            .select()
            .from(province)
            .where(eq(province.name, provinceSeed.name));

        if (existing.length > 0) {
            inserted[provinceSeed.name] = existing[0].id;
            continue;
        }

        const id = crypto.randomUUID();
        await db.insert(province).values({
            id,
            code: provinceSeed.code,
            name: provinceSeed.name,
            isActive: true,
        });
        inserted[provinceSeed.name] = id;
    }

    return inserted;
}

async function ensureRegencies(provinceMap: Record<string, string>) {
    const inserted: Record<string, string> = {};

    for (const [provinceName, regencies] of Object.entries(regenciesByProvince)) {
        const provinceId = provinceMap[provinceName];

        if (!provinceId) continue;

        for (const regencySeed of regencies) {
            const existing = await db
                .select()
                .from(regency)
                .where(eq(regency.name, regencySeed.name));

            if (existing.length > 0) {
                inserted[regencySeed.name] = existing[0].id;
                continue;
            }

            const id = crypto.randomUUID();
            await db.insert(regency).values({
                id,
                code: regencySeed.code,
                name: regencySeed.name,
                provinceId,
                isActive: true,
            });
            inserted[regencySeed.name] = id;
        }
    }

    return inserted;
}

async function ensureDistricts(regencyMap: Record<string, string>) {
    for (const [regencyName, districts] of Object.entries(districtsByRegency)) {
        const regencyId = regencyMap[regencyName];

        if (!regencyId) continue;

        for (const districtSeed of districts) {
            const existing = await db
                .select()
                .from(district)
                .where(eq(district.name, districtSeed.name));

            if (existing.length > 0) {
                continue;
            }

            await db.insert(district).values({
                id: crypto.randomUUID(),
                code: districtSeed.code,
                name: districtSeed.name,
                regencyId,
                isActive: true,
            });
        }
    }
}

async function ensureDepartments() {
    const deptMap: Record<string, string> = {};

    for (const departmentSeed of departments) {
        const existing = await db
            .select()
            .from(department)
            .where(eq(department.name, departmentSeed.name));

        if (existing.length > 0) {
            deptMap[departmentSeed.name] = existing[0].id;
            continue;
        }

        const id = crypto.randomUUID();
        await db.insert(department).values({
            id,
            code: departmentSeed.code,
            name: departmentSeed.name,
            isActive: true,
        });
        deptMap[departmentSeed.name] = id;
    }

    return deptMap;
}

async function ensureJobPositions(deptMap: Record<string, string>) {
    for (const jobSeed of jobPositions) {
        const departmentId = deptMap[jobSeed.department];
        const existing = await db
            .select()
            .from(jobPosition)
            .where(eq(jobPosition.name, jobSeed.name));

        if (existing.length > 0) {
            continue;
        }

        await db.insert(jobPosition).values({
            id: crypto.randomUUID(),
            code: jobSeed.code,
            name: jobSeed.name,
            departmentId: departmentId ?? undefined,
            isActive: true,
        });
    }
}

async function seedMasterData() {
    const provinceMap = await ensureProvince();
    const regencyMap = await ensureRegencies(provinceMap);
    await ensureDistricts(regencyMap);
    const deptMap = await ensureDepartments();
    await ensureJobPositions(deptMap);

    console.log("Master data seeded successfully.");
}

void seedMasterData().catch((error) => {
    console.error("Failed to seed master data:", error);
    process.exitCode = 1;
});
