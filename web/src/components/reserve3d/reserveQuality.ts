export type ReserveQualityTier = 'low' | 'medium' | 'high';

export type ReserveQualityConfig = {
  dpr: [number, number];
  shellSegments: [number, number];
  coreDetail: number;
  wireDetail: number;
  particleCount: number;
  orbitRingCount: number;
  ringSegments: number;
  baseSegments: number;
  animateIdle: boolean;
  shellMaterial: 'physical' | 'standard' | 'basic';
};

export const reserveQualityConfigs: Record<ReserveQualityTier, ReserveQualityConfig> = {
  high: {
    dpr: [1, 1.5],
    shellSegments: [48, 32],
    coreDetail: 4,
    wireDetail: 2,
    particleCount: 60,
    orbitRingCount: 2,
    ringSegments: 128,
    baseSegments: 48,
    animateIdle: true,
    shellMaterial: 'physical',
  },
  medium: {
    dpr: [0.85, 1.15],
    shellSegments: [32, 24],
    coreDetail: 3,
    wireDetail: 1,
    particleCount: 30,
    orbitRingCount: 1,
    ringSegments: 88,
    baseSegments: 32,
    animateIdle: true,
    shellMaterial: 'standard',
  },
  low: {
    dpr: [0.75, 1],
    shellSegments: [24, 16],
    coreDetail: 2,
    wireDetail: 0,
    particleCount: 12,
    orbitRingCount: 0,
    ringSegments: 64,
    baseSegments: 24,
    animateIdle: false,
    shellMaterial: 'basic',
  },
};

const mobileDeviceQuery = '(max-width: 719px), (max-width: 1024px) and (pointer: coarse)';

function isMobileDevice(): boolean {
  return window.matchMedia(mobileDeviceQuery).matches;
}

export function getInitialReserveQuality(reducedMotion: boolean): ReserveQualityTier {
  if (reducedMotion) {
    return 'low';
  }

  const isMobile = isMobileDevice();

  if (!isMobile) {
    return 'high';
  }

  const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };
  const hasLowMemory = navigatorWithMemory.deviceMemory !== undefined && navigatorWithMemory.deviceMemory <= 2;
  const hasFewCores = navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 2;

  return hasLowMemory || hasFewCores ? 'low' : 'medium';
}

export function getMaximumReserveQuality(reducedMotion: boolean): ReserveQualityTier {
  if (reducedMotion) {
    return 'low';
  }

  if (!isMobileDevice()) {
    return 'high';
  }

  const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };
  const hasDesktopClassMemory =
    navigatorWithMemory.deviceMemory !== undefined && navigatorWithMemory.deviceMemory >= 8;
  const hasDesktopClassCpu = navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency >= 8;

  return hasDesktopClassMemory && hasDesktopClassCpu ? 'high' : 'medium';
}

export function lowerReserveQuality(tier: ReserveQualityTier): ReserveQualityTier {
  return tier === 'high' ? 'medium' : 'low';
}

export function raiseReserveQuality(tier: ReserveQualityTier): ReserveQualityTier {
  return tier === 'low' ? 'medium' : 'high';
}
