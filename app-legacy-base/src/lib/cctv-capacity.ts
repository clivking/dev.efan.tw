import {
    DEFAULT_SAFETY_MARGIN,
    FILESYSTEM_OVERHEAD_RATIO,
    type ActivityLevel,
    type CompressionFormat,
    type RecordingMode,
    type ResolutionOption,
    getEffectiveRecordingHours,
    getRecommendedBitrateMbps,
} from '@/lib/cctv-capacity-presets';

export type BitrateMode = 'recommended' | 'manual';

export interface CapacityInputs {
    cameraCount: number;
    resolution: ResolutionOption;
    compression: CompressionFormat;
    fps: number;
    hoursPerDay: number;
    activityLevel: ActivityLevel;
    recordingMode: RecordingMode;
    bitrateMode: BitrateMode;
    manualBitrateMbps?: number;
    safetyMargin?: number;
}

export interface CapacityCalculationInputs extends CapacityInputs {
    retentionDays: number;
}

export interface RetentionCalculationInputs extends CapacityInputs {
    driveCapacityTb: number;
}

export interface CapacityResult {
    bitrateMbps: number;
    effectiveHoursPerDay: number;
    dailyStorageGb: number;
    dailyStorageTb: number;
    requiredStorageTb: number;
    recommendedStorageTb: number;
}

export interface RetentionResult extends CapacityResult {
    usableDriveCapacityTb: number;
    estimatedRetentionDays: number;
}

function sanitizeNumber(value: number, fallback: number, min = 0) {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(value, min);
}

function resolveBitrateMbps(inputs: CapacityInputs) {
    const recommendedBitrate = getRecommendedBitrateMbps(
        inputs.resolution,
        inputs.compression,
        inputs.fps,
        inputs.activityLevel,
    );

    if (inputs.bitrateMode === 'manual' && inputs.manualBitrateMbps && inputs.manualBitrateMbps > 0) {
        return Number(inputs.manualBitrateMbps.toFixed(2));
    }

    return recommendedBitrate;
}

function calculateBase(inputs: CapacityInputs): CapacityResult {
    const bitrateMbps = resolveBitrateMbps(inputs);
    const effectiveHoursPerDay = getEffectiveRecordingHours(
        sanitizeNumber(inputs.hoursPerDay, 24),
        inputs.recordingMode,
        inputs.activityLevel,
    );
    const cameraCount = sanitizeNumber(inputs.cameraCount, 1, 1);
    const safetyMargin = sanitizeNumber(inputs.safetyMargin ?? DEFAULT_SAFETY_MARGIN, DEFAULT_SAFETY_MARGIN);
    const dailyStorageGb = (cameraCount * bitrateMbps * effectiveHoursPerDay * 3600) / 8 / 1024;
    const dailyStorageTb = dailyStorageGb / 1024;

    return {
        bitrateMbps: Number(bitrateMbps.toFixed(2)),
        effectiveHoursPerDay: Number(effectiveHoursPerDay.toFixed(2)),
        dailyStorageGb: Number(dailyStorageGb.toFixed(2)),
        dailyStorageTb: Number(dailyStorageTb.toFixed(3)),
        requiredStorageTb: 0,
        recommendedStorageTb: Number((dailyStorageTb * (1 + safetyMargin)).toFixed(2)),
    };
}

export function calculateRequiredStorage(inputs: CapacityCalculationInputs): CapacityResult {
    const base = calculateBase(inputs);
    const retentionDays = sanitizeNumber(inputs.retentionDays, 30, 1);
    const safetyMargin = sanitizeNumber(inputs.safetyMargin ?? DEFAULT_SAFETY_MARGIN, DEFAULT_SAFETY_MARGIN);
    const requiredStorageTb = base.dailyStorageTb * retentionDays;
    const recommendedStorageTb = requiredStorageTb * (1 + safetyMargin);

    return {
        ...base,
        requiredStorageTb: Number(requiredStorageTb.toFixed(2)),
        recommendedStorageTb: Number(recommendedStorageTb.toFixed(2)),
    };
}

export function calculateRetentionDays(inputs: RetentionCalculationInputs): RetentionResult {
    const base = calculateBase(inputs);
    const safetyMargin = sanitizeNumber(inputs.safetyMargin ?? DEFAULT_SAFETY_MARGIN, DEFAULT_SAFETY_MARGIN);
    const driveCapacityTb = sanitizeNumber(inputs.driveCapacityTb, 1, 0.1);
    const usableDriveCapacityTb = driveCapacityTb * FILESYSTEM_OVERHEAD_RATIO * (1 - safetyMargin);
    const estimatedRetentionDays = base.dailyStorageTb > 0 ? usableDriveCapacityTb / base.dailyStorageTb : 0;

    return {
        ...base,
        requiredStorageTb: Number((base.dailyStorageTb * estimatedRetentionDays).toFixed(2)),
        recommendedStorageTb: Number((driveCapacityTb * (1 + safetyMargin)).toFixed(2)),
        usableDriveCapacityTb: Number(usableDriveCapacityTb.toFixed(2)),
        estimatedRetentionDays: Number(estimatedRetentionDays.toFixed(1)),
    };
}

export function suggestDrivePlan(requiredTb: number) {
    const driveSizes = [2, 4, 6, 8, 10, 12, 16, 18, 20];
    const targets = [1, 2, 3, 4];

    for (const count of targets) {
        for (const driveSize of driveSizes) {
            if (driveSize * count >= requiredTb) {
                return `${driveSize}TB x ${count}`;
            }
        }
    }

    const rounded = Math.ceil(requiredTb / 4) * 4;
    return `${rounded}TB 以上，建議拆分多顆硬碟`;
}

export function formatCapacityTb(value: number) {
    return `${value.toFixed(value >= 10 ? 1 : 2)} TB`;
}

export function formatDays(value: number) {
    return `${value.toFixed(value >= 10 ? 0 : 1)} 天`;
}
