import * as THREE from 'three';
import type { ReserveQualityTier } from '../reserveQuality';

export const GOAL_VISUAL_PALETTE = {
  accentComplete: '#bad85a',
  accentEmissiveEnd: '#91b217',
  accentEmissiveStart: '#425319',
  accentMuted: '#788b52',
  bodyEmissiveEnd: '#43561d',
  bodyEmissiveStart: '#162820',
  bodyEnd: '#697963',
  bodyStart: '#34413b',
  darkEmissiveEnd: '#29361d',
  darkEmissiveStart: '#0c1712',
  darkEnd: '#2b342d',
  darkStart: '#18211d',
  glassEmissiveEnd: '#294436',
  glassEmissiveStart: '#10231e',
  glassEnd: '#3a5a51',
  glassStart: '#233936',
  headlight: '#dde7c4',
  rimEnd: '#879388',
  rimStart: '#66736e',
  secondaryEnd: '#9caf76',
  secondaryStart: '#61776e',
  tyre: '#101715',
} as const;

const colors = {
  accentEnd: new THREE.Color(GOAL_VISUAL_PALETTE.accentComplete),
  accentEmissiveEnd: new THREE.Color(GOAL_VISUAL_PALETTE.accentEmissiveEnd),
  accentEmissiveStart: new THREE.Color(GOAL_VISUAL_PALETTE.accentEmissiveStart),
  accentStart: new THREE.Color(GOAL_VISUAL_PALETTE.accentMuted),
  bodyEmissiveEnd: new THREE.Color(GOAL_VISUAL_PALETTE.bodyEmissiveEnd),
  bodyEmissiveStart: new THREE.Color(GOAL_VISUAL_PALETTE.bodyEmissiveStart),
  bodyEnd: new THREE.Color(GOAL_VISUAL_PALETTE.bodyEnd),
  bodyStart: new THREE.Color(GOAL_VISUAL_PALETTE.bodyStart),
  darkEmissiveEnd: new THREE.Color(GOAL_VISUAL_PALETTE.darkEmissiveEnd),
  darkEmissiveStart: new THREE.Color(GOAL_VISUAL_PALETTE.darkEmissiveStart),
  darkEnd: new THREE.Color(GOAL_VISUAL_PALETTE.darkEnd),
  darkStart: new THREE.Color(GOAL_VISUAL_PALETTE.darkStart),
  glassEmissiveEnd: new THREE.Color(GOAL_VISUAL_PALETTE.glassEmissiveEnd),
  glassEmissiveStart: new THREE.Color(GOAL_VISUAL_PALETTE.glassEmissiveStart),
  glassEnd: new THREE.Color(GOAL_VISUAL_PALETTE.glassEnd),
  glassStart: new THREE.Color(GOAL_VISUAL_PALETTE.glassStart),
  rimEnd: new THREE.Color(GOAL_VISUAL_PALETTE.rimEnd),
  rimStart: new THREE.Color(GOAL_VISUAL_PALETTE.rimStart),
  secondaryEnd: new THREE.Color(GOAL_VISUAL_PALETTE.secondaryEnd),
  secondaryStart: new THREE.Color(GOAL_VISUAL_PALETTE.secondaryStart),
};

export type GoalVisualState = {
  accentColor: THREE.Color;
  accentEmissiveColor: THREE.Color;
  accentEmissiveIntensity: number;
  accentOpacity: number;
  bodyColor: THREE.Color;
  bodyEmissiveColor: THREE.Color;
  bodyEmissiveIntensity: number;
  bodyMetalness: number;
  bodyOpacity: number;
  bodyRoughness: number;
  completion: number;
  darkColor: THREE.Color;
  darkEmissiveColor: THREE.Color;
  darkEmissiveIntensity: number;
  darkOpacity: number;
  detailOpacity: number;
  easedProgress: number;
  glassColor: THREE.Color;
  glassEmissiveColor: THREE.Color;
  glassEmissiveIntensity: number;
  glassOpacity: number;
  lightOpacity: number;
  progress: number;
  qualityFactor: number;
  rimColor: THREE.Color;
  secondaryColor: THREE.Color;
};

function smoothStep(min: number, max: number, value: number): number {
  const normalized = THREE.MathUtils.clamp((value - min) / (max - min), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

function interpolateColor(start: THREE.Color, end: THREE.Color, progress: number): THREE.Color {
  return start.clone().lerp(end, progress);
}

export function getGoalVisualState(progress: number, quality: ReserveQualityTier): GoalVisualState {
  const visualProgress = THREE.MathUtils.clamp(progress, 0, 1);
  const easedProgress = smoothStep(0, 1, visualProgress);
  const completion = smoothStep(0.76, 1, visualProgress);
  const qualityFactor = quality === 'high' ? 1 : quality === 'medium' ? 0.92 : 0.82;

  return {
    accentColor: interpolateColor(colors.accentStart, colors.accentEnd, easedProgress),
    accentEmissiveColor: interpolateColor(
      colors.accentEmissiveStart,
      colors.accentEmissiveEnd,
      easedProgress,
    ),
    accentEmissiveIntensity: (0.22 + easedProgress * 0.36 + completion * 0.08) * qualityFactor,
    accentOpacity: 1,
    bodyColor: interpolateColor(colors.bodyStart, colors.bodyEnd, easedProgress),
    bodyEmissiveColor: interpolateColor(
      colors.bodyEmissiveStart,
      colors.bodyEmissiveEnd,
      easedProgress,
    ),
    bodyEmissiveIntensity: (0.16 + easedProgress * 0.3 + completion * 0.06) * qualityFactor,
    bodyMetalness: 0.28 + easedProgress * 0.14,
    bodyOpacity: 1,
    bodyRoughness: 0.62 - easedProgress * 0.16,
    completion,
    darkColor: interpolateColor(colors.darkStart, colors.darkEnd, easedProgress),
    darkEmissiveColor: interpolateColor(
      colors.darkEmissiveStart,
      colors.darkEmissiveEnd,
      easedProgress,
    ),
    darkEmissiveIntensity: (0.1 + easedProgress * 0.18 + completion * 0.04) * qualityFactor,
    darkOpacity: 1,
    detailOpacity: (0.38 + easedProgress * 0.34) * qualityFactor,
    easedProgress,
    glassColor: interpolateColor(colors.glassStart, colors.glassEnd, easedProgress),
    glassEmissiveColor: interpolateColor(
      colors.glassEmissiveStart,
      colors.glassEmissiveEnd,
      easedProgress,
    ),
    glassEmissiveIntensity: (0.1 + easedProgress * 0.16 + completion * 0.04) * qualityFactor,
    glassOpacity: 0.88 + easedProgress * 0.09,
    lightOpacity: (0.56 + easedProgress * 0.27 + completion * 0.08) * qualityFactor,
    progress: visualProgress,
    qualityFactor,
    rimColor: interpolateColor(colors.rimStart, colors.rimEnd, easedProgress),
    secondaryColor: interpolateColor(colors.secondaryStart, colors.secondaryEnd, easedProgress),
  };
}

export function setGoalBaseOpacity(
  material: THREE.Material,
  opacity: number,
  keepTransparent = false,
): void {
  material.opacity = opacity;
  material.userData.goalBaseOpacity = opacity;
  material.userData.goalKeepTransparent = keepTransparent;
}

export function setGoalBaseEmissiveIntensity(
  material: THREE.MeshStandardMaterial,
  intensity: number,
): void {
  material.emissiveIntensity = intensity;
  material.userData.goalBaseEmissiveIntensity = intensity;
}
