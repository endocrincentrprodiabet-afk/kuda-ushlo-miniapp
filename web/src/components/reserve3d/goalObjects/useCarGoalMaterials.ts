import { useEffect, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ReserveQualityTier } from '../reserveQuality';
import {
  GOAL_VISUAL_PALETTE,
  getGoalVisualState,
  setGoalBaseOpacity,
  setGoalBaseEmissiveIntensity,
} from './goalVisualSystem';

export type CarGoalMaterials = {
  bodyShell: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  grille: THREE.MeshStandardMaterial;
  headlight: THREE.MeshStandardMaterial;
  outline: THREE.MeshStandardMaterial;
  panelLine: THREE.MeshStandardMaterial;
  rim: THREE.MeshStandardMaterial;
  secondaryLine: THREE.MeshStandardMaterial;
  tyre: THREE.MeshStandardMaterial;
};

function updateCarMaterials(materials: CarGoalMaterials, progress: number, quality: ReserveQualityTier): void {
  const visual = getGoalVisualState(progress, quality);

  materials.bodyShell.color.copy(visual.bodyColor);
  materials.bodyShell.emissive.copy(visual.bodyEmissiveColor);
  setGoalBaseEmissiveIntensity(materials.bodyShell, visual.bodyEmissiveIntensity);
  materials.bodyShell.metalness = visual.bodyMetalness;
  materials.bodyShell.roughness = visual.bodyRoughness;
  setGoalBaseOpacity(materials.bodyShell, visual.bodyOpacity);

  materials.outline.color.copy(visual.accentColor);
  materials.outline.emissive.copy(visual.accentEmissiveColor);
  setGoalBaseEmissiveIntensity(materials.outline, visual.accentEmissiveIntensity * 0.7);
  setGoalBaseOpacity(materials.outline, visual.detailOpacity * 0.72, true);

  materials.panelLine.color.copy(visual.accentColor);
  materials.panelLine.emissive.copy(visual.accentEmissiveColor);
  setGoalBaseEmissiveIntensity(materials.panelLine, visual.accentEmissiveIntensity * 0.42);
  setGoalBaseOpacity(materials.panelLine, visual.detailOpacity * 0.38, true);

  materials.secondaryLine.color.copy(visual.secondaryColor);
  materials.secondaryLine.emissive.copy(visual.glassEmissiveColor);
  setGoalBaseEmissiveIntensity(materials.secondaryLine, visual.glassEmissiveIntensity * 0.5);
  setGoalBaseOpacity(materials.secondaryLine, visual.detailOpacity * 0.3, true);

  materials.glass.color.copy(visual.glassColor);
  materials.glass.emissive.copy(visual.glassEmissiveColor);
  setGoalBaseEmissiveIntensity(materials.glass, visual.glassEmissiveIntensity);
  materials.glass.roughness = 0.3;
  materials.glass.metalness = 0.42;
  setGoalBaseOpacity(materials.glass, visual.glassOpacity, true);

  materials.headlight.color.set(GOAL_VISUAL_PALETTE.headlight);
  materials.headlight.emissive.copy(visual.accentEmissiveColor);
  setGoalBaseEmissiveIntensity(materials.headlight, visual.accentEmissiveIntensity * 1.2);
  setGoalBaseOpacity(materials.headlight, visual.lightOpacity, true);

  materials.tyre.color.set(GOAL_VISUAL_PALETTE.tyre);
  materials.tyre.emissive.copy(visual.darkEmissiveColor);
  setGoalBaseEmissiveIntensity(materials.tyre, visual.darkEmissiveIntensity * 0.22);
  materials.tyre.roughness = 0.86;
  setGoalBaseOpacity(materials.tyre, visual.darkOpacity);

  materials.rim.color.copy(visual.rimColor);
  materials.rim.emissive.copy(visual.glassEmissiveColor);
  setGoalBaseEmissiveIntensity(materials.rim, visual.glassEmissiveIntensity * 0.3);
  materials.rim.metalness = 0.7;
  materials.rim.roughness = 0.34;
  setGoalBaseOpacity(materials.rim, 1);

  materials.grille.color.copy(visual.darkColor);
  materials.grille.emissive.copy(visual.darkEmissiveColor);
  setGoalBaseEmissiveIntensity(materials.grille, visual.darkEmissiveIntensity * 0.55);
  materials.grille.metalness = 0.46;
  materials.grille.roughness = 0.62;
  setGoalBaseOpacity(materials.grille, visual.darkOpacity);
}

export function useCarGoalMaterials(progress: number, quality: ReserveQualityTier): CarGoalMaterials {
  const materials = useMemo<CarGoalMaterials>(() => ({
    bodyShell: new THREE.MeshStandardMaterial({
      color: GOAL_VISUAL_PALETTE.bodyStart,
      emissive: GOAL_VISUAL_PALETTE.bodyEmissiveStart,
      flatShading: false,
      side: THREE.DoubleSide,
      transparent: false,
    }),
    glass: new THREE.MeshStandardMaterial({
      color: GOAL_VISUAL_PALETTE.glassStart,
      emissive: GOAL_VISUAL_PALETTE.glassEmissiveStart,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      side: THREE.DoubleSide,
      transparent: true,
    }),
    grille: new THREE.MeshStandardMaterial({
      color: GOAL_VISUAL_PALETTE.darkStart,
      emissive: GOAL_VISUAL_PALETTE.darkEmissiveStart,
      transparent: false,
    }),
    headlight: new THREE.MeshStandardMaterial({
      color: GOAL_VISUAL_PALETTE.headlight,
      emissive: GOAL_VISUAL_PALETTE.accentEmissiveStart,
      transparent: true,
    }),
    outline: new THREE.MeshStandardMaterial({
      color: GOAL_VISUAL_PALETTE.accentMuted,
      emissive: GOAL_VISUAL_PALETTE.accentEmissiveStart,
      transparent: true,
    }),
    panelLine: new THREE.MeshStandardMaterial({
      color: GOAL_VISUAL_PALETTE.accentMuted,
      emissive: GOAL_VISUAL_PALETTE.accentEmissiveStart,
      transparent: true,
    }),
    rim: new THREE.MeshStandardMaterial({
      color: GOAL_VISUAL_PALETTE.rimStart,
      emissive: GOAL_VISUAL_PALETTE.glassEmissiveStart,
      flatShading: false,
      transparent: false,
    }),
    secondaryLine: new THREE.MeshStandardMaterial({
      color: GOAL_VISUAL_PALETTE.secondaryStart,
      emissive: GOAL_VISUAL_PALETTE.glassEmissiveStart,
      transparent: true,
    }),
    tyre: new THREE.MeshStandardMaterial({
      color: GOAL_VISUAL_PALETTE.tyre,
      emissive: GOAL_VISUAL_PALETTE.darkEmissiveStart,
      flatShading: false,
      transparent: false,
    }),
  }), [quality]);

  useLayoutEffect(() => {
    updateCarMaterials(materials, progress, quality);
  }, [materials, progress, quality]);

  useEffect(() => () => {
    Object.values(materials).forEach((material) => material.dispose());
  }, [materials]);

  return materials;
}
