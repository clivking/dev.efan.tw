export type SensorFormat = '1/3' | '1/2.8' | '1/2.5' | '1/1.8';
export type FocalCalculatorMode = 'focal' | 'coverage';

export const SENSOR_OPTIONS: Array<{
    value: SensorFormat;
    label: string;
    widthMm: number;
    note: string;
}> = [
    { value: '1/3', label: '1/3"', widthMm: 4.8, note: '常見入門型 CCTV' },
    { value: '1/2.8', label: '1/2.8"', widthMm: 5.37, note: '常見 2MP / 4MP 監視器' },
    { value: '1/2.5', label: '1/2.5"', widthMm: 5.76, note: '部分 4MP / 5MP 機種' },
    { value: '1/1.8', label: '1/1.8"', widthMm: 7.2, note: '高階低照度或 AI 機種' },
];

export const COMMON_LENS_OPTIONS = [2.8, 4, 6, 8, 12, 16, 25, 50];

function sanitizePositive(value: number, fallback: number) {
    if (!Number.isFinite(value) || value <= 0) return fallback;
    return value;
}

export function getSensorWidthMm(sensor: SensorFormat) {
    return SENSOR_OPTIONS.find((option) => option.value === sensor)?.widthMm ?? 5.37;
}

export function calculateFocalLengthMm(distanceMeters: number, sceneWidthMeters: number, sensor: SensorFormat) {
    const distance = sanitizePositive(distanceMeters, 5);
    const sceneWidth = sanitizePositive(sceneWidthMeters, 3);
    const sensorWidth = getSensorWidthMm(sensor);
    const focalLengthMm = (sensorWidth * distance) / sceneWidth;
    return Number(focalLengthMm.toFixed(2));
}

export function calculateCoverageWidthMeters(distanceMeters: number, focalLengthMm: number, sensor: SensorFormat) {
    const distance = sanitizePositive(distanceMeters, 5);
    const focalLength = sanitizePositive(focalLengthMm, 4);
    const sensorWidth = getSensorWidthMm(sensor);
    const sceneWidthMeters = (sensorWidth * distance) / focalLength;
    return Number(sceneWidthMeters.toFixed(2));
}

export function calculateHorizontalFovDegrees(focalLengthMm: number, sensor: SensorFormat) {
    const focalLength = sanitizePositive(focalLengthMm, 4);
    const sensorWidth = getSensorWidthMm(sensor);
    const radians = 2 * Math.atan(sensorWidth / (2 * focalLength));
    const degrees = (radians * 180) / Math.PI;
    return Number(degrees.toFixed(1));
}

export function findNearestLensOption(focalLengthMm: number) {
    const focalLength = sanitizePositive(focalLengthMm, 4);
    return COMMON_LENS_OPTIONS.reduce((closest, current) =>
        Math.abs(current - focalLength) < Math.abs(closest - focalLength) ? current : closest
    );
}

export function findNeighborLensOptions(focalLengthMm: number) {
    const focalLength = sanitizePositive(focalLengthMm, 4);
    const sorted = [...COMMON_LENS_OPTIONS].sort((a, b) => a - b);
    let lower: number | null = null;
    let upper: number | null = null;

    for (const option of sorted) {
        if (option <= focalLength) lower = option;
        if (option >= focalLength) {
            upper = option;
            break;
        }
    }

    return { lower, upper };
}

export function describeLensDirection(exactFocalMm: number, chosenLensMm: number) {
    if (Math.abs(exactFocalMm - chosenLensMm) < 0.15) return '和試算值幾乎一致';
    return chosenLensMm > exactFocalMm ? '畫面會更窄、更聚焦' : '畫面會更廣、覆蓋更多';
}
