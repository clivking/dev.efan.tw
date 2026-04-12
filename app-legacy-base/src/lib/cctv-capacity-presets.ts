export type CompressionFormat = 'h264' | 'h265' | 'h265plus';
export type ResolutionOption = '720p' | '1080p' | '3mp' | '4mp' | '5mp' | '6mp' | '8mp' | '12mp';
export type ActivityLevel = 'low' | 'medium' | 'high';
export type RecordingMode = 'continuous' | 'motion';

export const RESOLUTION_OPTIONS: Array<{ value: ResolutionOption; label: string }> = [
    { value: '720p', label: '720p' },
    { value: '1080p', label: '1080p' },
    { value: '3mp', label: '3MP' },
    { value: '4mp', label: '4MP (2K)' },
    { value: '5mp', label: '5MP' },
    { value: '6mp', label: '6MP' },
    { value: '8mp', label: '8MP (4K)' },
    { value: '12mp', label: '12MP' },
];

export const COMPRESSION_OPTIONS: Array<{ value: CompressionFormat; label: string }> = [
    { value: 'h264', label: 'H.264' },
    { value: 'h265', label: 'H.265' },
    { value: 'h265plus', label: 'H.265+' },
];

export const FPS_OPTIONS = [5, 10, 15, 20, 25, 30] as const;
export const HOURS_PER_DAY_OPTIONS = [24, 16, 12, 8] as const;

export const ACTIVITY_OPTIONS: Array<{ value: ActivityLevel; label: string; description: string }> = [
    { value: 'low', label: '低', description: '固定畫面、低人流或低車流。' },
    { value: 'medium', label: '中', description: '一般辦公室、店面或常見公共區域。' },
    { value: 'high', label: '高', description: '高人流、高車流或夜間雜訊較多。' },
];

export const RECORDING_MODE_OPTIONS: Array<{ value: RecordingMode; label: string; description: string }> = [
    { value: 'continuous', label: '24 小時連續錄影', description: '適合出入口、櫃台、走道等重要畫面。' },
    { value: 'motion', label: '移動偵測錄影', description: '只在有事件時錄影，較省空間。' },
];

export const DEFAULT_SAFETY_MARGIN = 0.1;
export const FILESYSTEM_OVERHEAD_RATIO = 0.93;

const BASE_BITRATE_AT_15FPS: Record<CompressionFormat, Record<ResolutionOption, number>> = {
    h264: {
        '720p': 2.2,
        '1080p': 4,
        '3mp': 5,
        '4mp': 6,
        '5mp': 8,
        '6mp': 10,
        '8mp': 12,
        '12mp': 18,
    },
    h265: {
        '720p': 1.2,
        '1080p': 2.2,
        '3mp': 3,
        '4mp': 3.8,
        '5mp': 4.8,
        '6mp': 5.8,
        '8mp': 8.5,
        '12mp': 12.8,
    },
    h265plus: {
        '720p': 0.9,
        '1080p': 1.8,
        '3mp': 2.3,
        '4mp': 3,
        '5mp': 3.8,
        '6mp': 4.6,
        '8mp': 6.8,
        '12mp': 10.4,
    },
};

const ACTIVITY_BITRATE_FACTOR: Record<ActivityLevel, number> = {
    low: 0.85,
    medium: 1,
    high: 1.2,
};

const MOTION_RECORDING_HOURS_FACTOR: Record<ActivityLevel, number> = {
    low: 0.35,
    medium: 0.5,
    high: 0.7,
};

export function getRecommendedBitrateMbps(
    resolution: ResolutionOption,
    compression: CompressionFormat,
    fps: number,
    activity: ActivityLevel,
) {
    const baseBitrate = BASE_BITRATE_AT_15FPS[compression][resolution];
    const fpsFactor = fps / 15;
    const bitrate = baseBitrate * fpsFactor * ACTIVITY_BITRATE_FACTOR[activity];
    return Number(bitrate.toFixed(2));
}

export function getEffectiveRecordingHours(
    hoursPerDay: number,
    recordingMode: RecordingMode,
    activity: ActivityLevel,
) {
    if (recordingMode === 'continuous') {
        return hoursPerDay;
    }

    return Number((hoursPerDay * MOTION_RECORDING_HOURS_FACTOR[activity]).toFixed(2));
}
