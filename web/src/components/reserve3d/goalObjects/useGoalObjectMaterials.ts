import { useEffect, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ReserveQualityTier } from '../reserveQuality';

export type GoalObjectMaterials = {
  accent: THREE.MeshStandardMaterial;
  body: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
};

const bodyStart = new THREE.Color('#263038');
const bodyEnd = new THREE.Color('#71817a');
const bodyEmissiveStart = new THREE.Color('#07110f');
const bodyEmissiveEnd = new THREE.Color('#25483d');
const accentStart = new THREE.Color('#40534f');
const accentEnd = new THREE.Color('#d7ff17');
const accentEmissiveStart = new THREE.Color('#10201d');
const accentEmissiveEnd = new THREE.Color('#78930b');
const glassStart = new THREE.Color('#102225');
const glassEnd = new THREE.Color('#2e766f');

function setBaseOpacity(material: THREE.Material, opacity: number) {
  material.opacity = opacity;
  material.userData.goalBaseOpacity = opacity;
}

function updateMaterials(materials: GoalObjectMaterials, progress: number, quality: ReserveQualityTier) {
  const visualProgress = THREE.MathUtils.clamp(progress, 0, 1);
  const qualityFactor = quality === 'high' ? 1 : quality === 'medium' ? 0.82 : 0.62;

  materials.body.color.copy(bodyStart).lerp(bodyEnd, 0.18 + visualProgress * 0.82);
  materials.body.emissive.copy(bodyEmissiveStart).lerp(bodyEmissiveEnd, visualProgress);
  materials.body.emissiveIntensity = (0.04 + visualProgress * 0.18) * qualityFactor;
  materials.body.metalness = 0.18 + visualProgress * 0.13;
  materials.body.roughness = 0.62 - visualProgress * 0.2;
  setBaseOpacity(materials.body, 0.78 + visualProgress * 0.22);

  materials.accent.color.copy(accentStart).lerp(accentEnd, 0.1 + visualProgress * 0.9);
  materials.accent.emissive.copy(accentEmissiveStart).lerp(accentEmissiveEnd, visualProgress);
  materials.accent.emissiveIntensity = (0.08 + visualProgress * 0.68) * qualityFactor;
  materials.accent.metalness = 0.12 + visualProgress * 0.16;
  materials.accent.roughness = 0.48 - visualProgress * 0.14;
  setBaseOpacity(materials.accent, 0.34 + visualProgress * 0.66);

  materials.glass.color.copy(glassStart).lerp(glassEnd, 0.16 + visualProgress * 0.84);
  materials.glass.emissive.copy(glassStart).lerp(glassEnd, visualProgress * 0.72);
  materials.glass.emissiveIntensity = (0.08 + visualProgress * 0.34) * qualityFactor;
  materials.glass.roughness = 0.3 - visualProgress * 0.08;
  setBaseOpacity(materials.glass, 0.42 + visualProgress * 0.38);

  materials.dark.emissiveIntensity = visualProgress * 0.04 * qualityFactor;
  materials.dark.roughness = 0.66 - visualProgress * 0.08;
  setBaseOpacity(materials.dark, 0.84 + visualProgress * 0.16);
}

export function useGoalObjectMaterials(progress: number, quality: ReserveQualityTier): GoalObjectMaterials {
  const materials = useMemo<GoalObjectMaterials>(() => {
    const nextMaterials = {
      accent: new THREE.MeshStandardMaterial({
        color: accentStart,
        emissive: accentEmissiveStart,
        flatShading: true,
        transparent: true,
      }),
      body: new THREE.MeshStandardMaterial({
        color: bodyStart,
        emissive: bodyEmissiveStart,
        flatShading: true,
        transparent: true,
      }),
      dark: new THREE.MeshStandardMaterial({
        color: '#0c1116',
        emissive: '#07100f',
        flatShading: true,
        metalness: 0.32,
        transparent: true,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: glassStart,
        emissive: glassStart,
        flatShading: true,
        metalness: 0.38,
        transparent: true,
      }),
    };

    updateMaterials(nextMaterials, 0, quality);
    return nextMaterials;
  }, [quality]);

  useLayoutEffect(() => {
    updateMaterials(materials, progress, quality);
  }, [materials, progress, quality]);

  useEffect(
    () => () => {
      Object.values(materials).forEach((material) => material.dispose());
    },
    [materials],
  );

  return materials;
}
