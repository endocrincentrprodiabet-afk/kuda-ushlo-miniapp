import { useEffect, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ReserveQualityTier } from '../reserveQuality';
import {
  GOAL_VISUAL_PALETTE,
  getGoalVisualState,
  setGoalBaseOpacity,
  setGoalBaseEmissiveIntensity,
} from './goalVisualSystem';

export type GoalObjectMaterials = {
  accent: THREE.MeshStandardMaterial;
  body: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
};

function updateMaterials(materials: GoalObjectMaterials, progress: number, quality: ReserveQualityTier): void {
  const visual = getGoalVisualState(progress, quality);

  materials.body.color.copy(visual.bodyColor);
  materials.body.emissive.copy(visual.bodyEmissiveColor);
  setGoalBaseEmissiveIntensity(materials.body, visual.bodyEmissiveIntensity);
  materials.body.metalness = visual.bodyMetalness;
  materials.body.roughness = visual.bodyRoughness;
  setGoalBaseOpacity(materials.body, visual.bodyOpacity);

  materials.accent.color.copy(visual.accentColor);
  materials.accent.emissive.copy(visual.accentEmissiveColor);
  setGoalBaseEmissiveIntensity(materials.accent, visual.accentEmissiveIntensity);
  materials.accent.metalness = 0.38;
  materials.accent.roughness = 0.44;
  setGoalBaseOpacity(materials.accent, visual.accentOpacity);

  materials.glass.color.copy(visual.glassColor);
  materials.glass.emissive.copy(visual.glassEmissiveColor);
  setGoalBaseEmissiveIntensity(materials.glass, visual.glassEmissiveIntensity);
  materials.glass.metalness = 0.46;
  materials.glass.roughness = 0.26;
  setGoalBaseOpacity(materials.glass, visual.glassOpacity, true);

  materials.dark.color.copy(visual.darkColor);
  materials.dark.emissive.copy(visual.darkEmissiveColor);
  setGoalBaseEmissiveIntensity(materials.dark, visual.darkEmissiveIntensity);
  materials.dark.roughness = 0.68 - visual.easedProgress * 0.08;
  setGoalBaseOpacity(materials.dark, visual.darkOpacity);
}

export function useGoalObjectMaterials(progress: number, quality: ReserveQualityTier): GoalObjectMaterials {
  const materials = useMemo<GoalObjectMaterials>(() => ({
    accent: new THREE.MeshStandardMaterial({
      color: GOAL_VISUAL_PALETTE.accentMuted,
      emissive: GOAL_VISUAL_PALETTE.accentEmissiveStart,
      flatShading: false,
      transparent: false,
    }),
    body: new THREE.MeshStandardMaterial({
      color: GOAL_VISUAL_PALETTE.bodyStart,
      emissive: GOAL_VISUAL_PALETTE.bodyEmissiveStart,
      flatShading: false,
      transparent: false,
    }),
    dark: new THREE.MeshStandardMaterial({
      color: GOAL_VISUAL_PALETTE.darkStart,
      emissive: GOAL_VISUAL_PALETTE.darkEmissiveStart,
      flatShading: false,
      metalness: 0.42,
      transparent: false,
    }),
    glass: new THREE.MeshStandardMaterial({
      color: GOAL_VISUAL_PALETTE.glassStart,
      emissive: GOAL_VISUAL_PALETTE.glassEmissiveStart,
      flatShading: false,
      side: THREE.DoubleSide,
      transparent: true,
    }),
  }), [quality]);

  useLayoutEffect(() => {
    updateMaterials(materials, progress, quality);
  }, [materials, progress, quality]);

  useEffect(() => () => {
    Object.values(materials).forEach((material) => material.dispose());
  }, [materials]);

  return materials;
}
