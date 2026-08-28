export const OFFICE_LOCATIONS = ["Main Building", "Building A", "Building B"] as const;

export type OfficeLocation = (typeof OFFICE_LOCATIONS)[number];
export type AttendanceStatusValue = "Fulfilled" | "Not Fulfilled";
export type AttendanceType = "Present" | "Leave" | "Permission" | "Unpaid Leave";
export type AttendanceVerification = "Approved" | "Rejected";
export type AttendanceVerifier = "Lead" | "Manager" | "HRD";

export type AttendanceEvaluationInput = {
    checkInTime?: string | null;
    checkOutTime?: string | null;
    checkInLocation?: string | null;
    checkOutLocation?: string | null;
};

export type AttendanceEvaluationResult = {
    status: AttendanceStatusValue;
    effectiveWorkingHours: number;
    lateArrivalMinutes: number;
    isHalfDay: boolean;
    reason: string;
};

const NORMAL_START_MINUTES = 8 * 60;
const LATE_ARRIVAL_TOLERANCE_MINUTES = 15;
const BREAK_START_MINUTES = 12 * 60;
const BREAK_END_MINUTES = 13 * 60;

function parseTimeToMinutes(value?: string | null): number | null {
    if (!value) {
        return null;
    }

    const trimmed = value.trim();
    const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(trimmed);

    if (!match) {
        return null;
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    return hours * 60 + minutes;
}

function calculateBreakOverlapMinutes(checkInMinutes: number, checkOutMinutes: number): number {
    const overlapStart = Math.max(checkInMinutes, BREAK_START_MINUTES);
    const overlapEnd = Math.min(checkOutMinutes, BREAK_END_MINUTES);
    return Math.max(0, overlapEnd - overlapStart);
}

export function calculateEffectiveWorkingHours(
    checkInTime?: string | null,
    checkOutTime?: string | null,
): number {
    const checkInMinutes = parseTimeToMinutes(checkInTime);
    const checkOutMinutes = parseTimeToMinutes(checkOutTime);

    if (checkInMinutes === null || checkOutMinutes === null) {
        return 0;
    }

    const totalMinutes = checkOutMinutes - checkInMinutes;
    if (totalMinutes <= 0) {
        return 0;
    }

    const breakMinutes = calculateBreakOverlapMinutes(checkInMinutes, checkOutMinutes);
    const effectiveMinutes = Math.max(0, totalMinutes - breakMinutes);
    return Number((effectiveMinutes / 60).toFixed(1));
}

export function evaluateAttendanceStatus(input: AttendanceEvaluationInput): AttendanceEvaluationResult {
    const { checkInTime, checkOutTime, checkInLocation, checkOutLocation } = input;

    if (!checkInTime || !checkOutTime) {
        return {
            status: "Not Fulfilled",
            effectiveWorkingHours: 0,
            lateArrivalMinutes: 0,
            isHalfDay: false,
            reason: "Missing check-in or check-out record",
        };
    }

    const checkInMinutes = parseTimeToMinutes(checkInTime);
    const checkOutMinutes = parseTimeToMinutes(checkOutTime);

    if (checkInMinutes === null || checkOutMinutes === null) {
        return {
            status: "Not Fulfilled",
            effectiveWorkingHours: 0,
            lateArrivalMinutes: 0,
            isHalfDay: false,
            reason: "Invalid time format",
        };
    }

    if (checkInLocation && checkOutLocation && checkInLocation !== checkOutLocation) {
        return {
            status: "Not Fulfilled",
            effectiveWorkingHours: 0,
            lateArrivalMinutes: Math.max(0, checkInMinutes - NORMAL_START_MINUTES),
            isHalfDay: checkInMinutes > NORMAL_START_MINUTES + LATE_ARRIVAL_TOLERANCE_MINUTES,
            reason: "Location mismatch",
        };
    }

    const lateArrivalMinutes = Math.max(0, checkInMinutes - NORMAL_START_MINUTES);
    const isHalfDay = checkInMinutes > NORMAL_START_MINUTES + LATE_ARRIVAL_TOLERANCE_MINUTES;
    const effectiveWorkingHours = calculateEffectiveWorkingHours(checkInTime, checkOutTime);

    if (effectiveWorkingHours < 8) {
        return {
            status: "Not Fulfilled",
            effectiveWorkingHours,
            lateArrivalMinutes,
            isHalfDay,
            reason: "Effective working duration below minimum",
        };
    }

    return {
        status: "Fulfilled",
        effectiveWorkingHours,
        lateArrivalMinutes,
        isHalfDay,
        reason: isHalfDay ? "Late arrival classified as half-day but still meets minimum duration" : "Valid attendance",
    };
}
