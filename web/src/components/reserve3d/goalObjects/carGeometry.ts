import * as THREE from 'three';
import type { ReserveQualityTier } from '../reserveQuality';

type LoftSection = {
  bottom: number;
  halfWidth: number;
  shoulder: number;
  shoulderWidth: number;
  side: number;
  top: number;
  topWidth: number;
  underbodyWidth: number;
  x: number;
};

export type CarGeometryPack = {
  body: THREE.BufferGeometry;
  cabin: THREE.BufferGeometry;
  fineLines: THREE.BufferGeometry[];
  frontGrille: THREE.ShapeGeometry;
  keyLines: THREE.BufferGeometry[];
  lowerIntake: THREE.ShapeGeometry;
  panelLines: THREE.BufferGeometry[];
  rearWindow: THREE.BufferGeometry;
  sideWindows: THREE.BufferGeometry[];
  windshield: THREE.BufferGeometry;
};

const bodySections: LoftSection[] = [
  { x: -1.72, bottom: -0.22, side: -0.1, shoulder: 0.13, top: 0.24, halfWidth: 0.57, shoulderWidth: 0.66, topWidth: 0.42, underbodyWidth: 0.38 },
  { x: -1.56, bottom: -0.29, side: -0.13, shoulder: 0.27, top: 0.35, halfWidth: 0.7, shoulderWidth: 0.76, topWidth: 0.54, underbodyWidth: 0.5 },
  { x: -1.34, bottom: -0.31, side: -0.08, shoulder: 0.35, top: 0.42, halfWidth: 0.76, shoulderWidth: 0.8, topWidth: 0.6, underbodyWidth: 0.55 },
  { x: -1.13, bottom: -0.32, side: 0.04, shoulder: 0.4, top: 0.46, halfWidth: 0.78, shoulderWidth: 0.82, topWidth: 0.62, underbodyWidth: 0.55 },
  { x: -0.91, bottom: -0.32, side: 0.1, shoulder: 0.42, top: 0.48, halfWidth: 0.79, shoulderWidth: 0.83, topWidth: 0.63, underbodyWidth: 0.56 },
  { x: -0.68, bottom: -0.32, side: -0.08, shoulder: 0.41, top: 0.47, halfWidth: 0.79, shoulderWidth: 0.82, topWidth: 0.63, underbodyWidth: 0.57 },
  { x: -0.37, bottom: -0.33, side: -0.13, shoulder: 0.4, top: 0.44, halfWidth: 0.8, shoulderWidth: 0.82, topWidth: 0.64, underbodyWidth: 0.58 },
  { x: 0, bottom: -0.34, side: -0.14, shoulder: 0.38, top: 0.42, halfWidth: 0.81, shoulderWidth: 0.82, topWidth: 0.64, underbodyWidth: 0.59 },
  { x: 0.39, bottom: -0.34, side: -0.13, shoulder: 0.37, top: 0.41, halfWidth: 0.81, shoulderWidth: 0.82, topWidth: 0.64, underbodyWidth: 0.59 },
  { x: 0.72, bottom: -0.33, side: -0.06, shoulder: 0.37, top: 0.41, halfWidth: 0.8, shoulderWidth: 0.82, topWidth: 0.64, underbodyWidth: 0.58 },
  { x: 0.93, bottom: -0.32, side: 0.08, shoulder: 0.38, top: 0.42, halfWidth: 0.79, shoulderWidth: 0.81, topWidth: 0.63, underbodyWidth: 0.56 },
  { x: 1.14, bottom: -0.31, side: 0.09, shoulder: 0.37, top: 0.41, halfWidth: 0.77, shoulderWidth: 0.79, topWidth: 0.61, underbodyWidth: 0.54 },
  { x: 1.34, bottom: -0.29, side: 0.01, shoulder: 0.34, top: 0.38, halfWidth: 0.73, shoulderWidth: 0.76, topWidth: 0.57, underbodyWidth: 0.5 },
  { x: 1.54, bottom: -0.26, side: -0.08, shoulder: 0.28, top: 0.34, halfWidth: 0.66, shoulderWidth: 0.7, topWidth: 0.51, underbodyWidth: 0.45 },
  { x: 1.7, bottom: -0.19, side: -0.08, shoulder: 0.18, top: 0.25, halfWidth: 0.55, shoulderWidth: 0.61, topWidth: 0.4, underbodyWidth: 0.36 },
];

const cabinSections: LoftSection[] = [
  { x: -0.33, bottom: 0.39, side: 0.4, shoulder: 0.43, top: 0.45, halfWidth: 0.63, shoulderWidth: 0.55, topWidth: 0.48, underbodyWidth: 0.52 },
  { x: -0.17, bottom: 0.4, side: 0.43, shoulder: 0.61, top: 0.68, halfWidth: 0.63, shoulderWidth: 0.56, topWidth: 0.46, underbodyWidth: 0.53 },
  { x: 0.04, bottom: 0.4, side: 0.47, shoulder: 0.85, top: 0.94, halfWidth: 0.63, shoulderWidth: 0.51, topWidth: 0.4, underbodyWidth: 0.53 },
  { x: 0.27, bottom: 0.39, side: 0.48, shoulder: 1.0, top: 1.07, halfWidth: 0.63, shoulderWidth: 0.47, topWidth: 0.34, underbodyWidth: 0.53 },
  { x: 0.53, bottom: 0.38, side: 0.47, shoulder: 1.04, top: 1.1, halfWidth: 0.62, shoulderWidth: 0.45, topWidth: 0.33, underbodyWidth: 0.52 },
  { x: 0.76, bottom: 0.37, side: 0.46, shoulder: 0.98, top: 1.04, halfWidth: 0.61, shoulderWidth: 0.46, topWidth: 0.34, underbodyWidth: 0.51 },
  { x: 0.98, bottom: 0.36, side: 0.43, shoulder: 0.79, top: 0.87, halfWidth: 0.6, shoulderWidth: 0.49, topWidth: 0.38, underbodyWidth: 0.5 },
  { x: 1.18, bottom: 0.35, side: 0.4, shoulder: 0.56, top: 0.62, halfWidth: 0.58, shoulderWidth: 0.51, topWidth: 0.43, underbodyWidth: 0.48 },
  { x: 1.3, bottom: 0.34, side: 0.36, shoulder: 0.43, top: 0.47, halfWidth: 0.55, shoulderWidth: 0.5, topWidth: 0.44, underbodyWidth: 0.45 },
];

function sampleSections(sections: LoftSection[], quality: ReserveQualityTier): LoftSection[] {
  if (quality === 'high') {
    return sections;
  }

  const step = quality === 'medium' ? 2 : 3;
  return sections.filter((_, index) => index === 0 || index === sections.length - 1 || index % step !== 1);
}

function createLoftGeometry(sections: LoftSection[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const ringSize = 8;

  sections.forEach((section) => {
    const ring = [
      [section.x, section.bottom, -section.underbodyWidth],
      [section.x, section.side, -section.halfWidth],
      [section.x, section.shoulder, -section.shoulderWidth],
      [section.x, section.top, -section.topWidth],
      [section.x, section.top, section.topWidth],
      [section.x, section.shoulder, section.shoulderWidth],
      [section.x, section.side, section.halfWidth],
      [section.x, section.bottom, section.underbodyWidth],
    ];

    ring.forEach(([x, y, z]) => positions.push(x, y, z));
  });

  for (let sectionIndex = 0; sectionIndex < sections.length - 1; sectionIndex += 1) {
    const currentOffset = sectionIndex * ringSize;
    const nextOffset = (sectionIndex + 1) * ringSize;

    for (let ringIndex = 0; ringIndex < ringSize; ringIndex += 1) {
      const nextRingIndex = (ringIndex + 1) % ringSize;
      indices.push(
        currentOffset + ringIndex,
        nextOffset + ringIndex,
        nextOffset + nextRingIndex,
        currentOffset + ringIndex,
        nextOffset + nextRingIndex,
        currentOffset + nextRingIndex,
      );
    }
  }

  const firstCenter = positions.length / 3;
  const lastCenter = firstCenter + 1;
  const first = sections[0];
  const last = sections[sections.length - 1];
  positions.push(first.x, (first.bottom + first.top) / 2, 0, last.x, (last.bottom + last.top) / 2, 0);

  for (let ringIndex = 0; ringIndex < ringSize; ringIndex += 1) {
    const nextRingIndex = (ringIndex + 1) % ringSize;
    indices.push(firstCenter, nextRingIndex, ringIndex);
    const lastOffset = (sections.length - 1) * ringSize;
    indices.push(lastCenter, lastOffset + ringIndex, lastOffset + nextRingIndex);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createSurfaceGeometry(points: THREE.Vector3[], indices: number[]): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setFromPoints(points);
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createTubeGeometry(points: THREE.Vector3[], quality: ReserveQualityTier, closed = false): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal', 0.42);
  const tubularSegments = Math.max(8, (points.length - 1) * (quality === 'high' ? 7 : quality === 'medium' ? 5 : 4));
  const radius = quality === 'low' ? 0.011 : 0.009;
  return new THREE.TubeGeometry(curve, tubularSegments, radius, quality === 'high' ? 5 : 3, closed);
}

function createWheelArch(centerX: number, z: number, quality: ReserveQualityTier): THREE.BufferGeometry {
  const pointCount = quality === 'high' ? 13 : quality === 'medium' ? 9 : 7;
  const points = Array.from({ length: pointCount }, (_, index) => {
    const angle = Math.PI - (index / (pointCount - 1)) * Math.PI;
    return new THREE.Vector3(centerX + Math.cos(angle) * 0.46, -0.29 + Math.sin(angle) * 0.46, z);
  });
  return createTubeGeometry(points, quality);
}

function createRoundedPanelGeometry(width: number, height: number, radius: number): THREE.ShapeGeometry {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return new THREE.ShapeGeometry(shape, 5);
}

function sideWindowGeometries(side: 1 | -1): THREE.BufferGeometry[] {
  const z = side * 0.635;
  return [
    createSurfaceGeometry(
      [
        new THREE.Vector3(-0.2, 0.47, z),
        new THREE.Vector3(0.08, 0.87, side * 0.54),
        new THREE.Vector3(0.5, 1.02, side * 0.48),
        new THREE.Vector3(0.55, 0.47, z),
      ],
      side > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2],
    ),
    createSurfaceGeometry(
      [
        new THREE.Vector3(0.61, 0.47, z),
        new THREE.Vector3(0.58, 1.02, side * 0.48),
        new THREE.Vector3(0.93, 0.8, side * 0.52),
        new THREE.Vector3(1.13, 0.44, side * 0.6),
      ],
      side > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2],
    ),
  ];
}

function keyLineGeometries(quality: ReserveQualityTier): THREE.BufferGeometry[] {
  return [
    createTubeGeometry([
      new THREE.Vector3(-1.68, 0.19, 0.5),
      new THREE.Vector3(-1.25, 0.43, 0.68),
      new THREE.Vector3(-0.34, 0.44, 0.7),
      new THREE.Vector3(0.08, 0.91, 0.56),
      new THREE.Vector3(0.49, 1.11, 0.37),
      new THREE.Vector3(0.84, 1.0, 0.43),
      new THREE.Vector3(1.29, 0.46, 0.62),
      new THREE.Vector3(1.66, 0.22, 0.52),
    ], quality),
    createTubeGeometry([
      new THREE.Vector3(-1.58, 0.26, 0.71),
      new THREE.Vector3(-0.68, 0.4, 0.8),
      new THREE.Vector3(0.08, 0.38, 0.81),
      new THREE.Vector3(0.86, 0.37, 0.8),
      new THREE.Vector3(1.53, 0.29, 0.67),
    ], quality),
    createTubeGeometry([
      new THREE.Vector3(-1.45, -0.18, 0.69),
      new THREE.Vector3(-0.52, -0.22, 0.79),
      new THREE.Vector3(0.62, -0.22, 0.79),
      new THREE.Vector3(1.46, -0.17, 0.67),
    ], quality),
    createWheelArch(-0.97, 0.805, quality),
    createWheelArch(1.05, 0.795, quality),
  ];
}

function panelLineGeometries(quality: ReserveQualityTier): THREE.BufferGeometry[] {
  const doorOutline = [
    new THREE.Vector3(-0.18, 0.36, 0.815),
    new THREE.Vector3(0.02, 0.78, 0.68),
    new THREE.Vector3(0.52, 0.96, 0.58),
    new THREE.Vector3(0.89, 0.74, 0.67),
    new THREE.Vector3(0.92, -0.11, 0.79),
    new THREE.Vector3(-0.09, -0.13, 0.8),
    new THREE.Vector3(-0.18, 0.36, 0.815),
  ];

  return [
    createTubeGeometry([
      new THREE.Vector3(-1.55, 0.34, 0.35),
      new THREE.Vector3(-1.08, 0.48, 0.38),
      new THREE.Vector3(-0.38, 0.45, 0.4),
    ], quality),
    createTubeGeometry([
      new THREE.Vector3(-1.55, 0.34, -0.35),
      new THREE.Vector3(-1.08, 0.48, -0.38),
      new THREE.Vector3(-0.38, 0.45, -0.4),
    ], quality),
    createTubeGeometry(doorOutline, quality),
    createTubeGeometry([
      new THREE.Vector3(0.99, 0.39, 0.64),
      new THREE.Vector3(1.28, 0.38, 0.62),
      new THREE.Vector3(1.55, 0.31, 0.58),
    ], quality),
    createTubeGeometry([
      new THREE.Vector3(-1.69, -0.08, -0.5),
      new THREE.Vector3(-1.74, -0.12, 0),
      new THREE.Vector3(-1.69, -0.08, 0.5),
    ], quality),
  ];
}

function fineLineGeometries(quality: ReserveQualityTier): THREE.BufferGeometry[] {
  return [
    createTubeGeometry([
      new THREE.Vector3(-1.63, 0.1, -0.5),
      new THREE.Vector3(-0.65, 0.36, -0.77),
      new THREE.Vector3(0.54, 0.34, -0.78),
      new THREE.Vector3(1.55, 0.23, -0.6),
    ], quality),
    createWheelArch(-0.97, -0.795, quality),
    createWheelArch(1.05, -0.785, quality),
    createTubeGeometry([
      new THREE.Vector3(-0.2, 0.47, 0.65),
      new THREE.Vector3(0.08, 0.88, 0.55),
      new THREE.Vector3(0.5, 1.03, 0.49),
      new THREE.Vector3(0.94, 0.8, 0.53),
      new THREE.Vector3(1.14, 0.44, 0.61),
    ], quality),
    createTubeGeometry([
      new THREE.Vector3(-0.2, 0.47, -0.65),
      new THREE.Vector3(0.08, 0.88, -0.55),
      new THREE.Vector3(0.5, 1.03, -0.49),
      new THREE.Vector3(0.94, 0.8, -0.53),
      new THREE.Vector3(1.14, 0.44, -0.61),
    ], quality),
  ];
}

export function createCarGeometryPack(quality: ReserveQualityTier): CarGeometryPack {
  const sideWindows = [...sideWindowGeometries(1), ...sideWindowGeometries(-1)];
  const windshield = createSurfaceGeometry(
    [
      new THREE.Vector3(-0.27, 0.46, -0.58),
      new THREE.Vector3(-0.27, 0.46, 0.58),
      new THREE.Vector3(0.08, 0.9, -0.5),
      new THREE.Vector3(0.08, 0.9, 0.5),
    ],
    [0, 2, 1, 1, 2, 3],
  );
  const rearWindow = createSurfaceGeometry(
    [
      new THREE.Vector3(0.76, 0.98, -0.47),
      new THREE.Vector3(0.76, 0.98, 0.47),
      new THREE.Vector3(1.2, 0.47, -0.56),
      new THREE.Vector3(1.2, 0.47, 0.56),
    ],
    [0, 2, 1, 1, 2, 3],
  );

  return {
    body: createLoftGeometry(sampleSections(bodySections, quality)),
    cabin: createLoftGeometry(sampleSections(cabinSections, quality)),
    fineLines: quality === 'high' ? fineLineGeometries(quality) : [],
    frontGrille: createRoundedPanelGeometry(0.76, 0.34, 0.1),
    keyLines: keyLineGeometries(quality),
    lowerIntake: createRoundedPanelGeometry(0.92, 0.13, 0.05),
    panelLines: quality === 'low' ? [] : panelLineGeometries(quality),
    rearWindow,
    sideWindows,
    windshield,
  };
}

export function disposeCarGeometryPack(pack: CarGeometryPack): void {
  pack.body.dispose();
  pack.cabin.dispose();
  pack.frontGrille.dispose();
  pack.lowerIntake.dispose();
  pack.windshield.dispose();
  pack.rearWindow.dispose();
  pack.sideWindows.forEach((geometry) => geometry.dispose());
  pack.keyLines.forEach((geometry) => geometry.dispose());
  pack.panelLines.forEach((geometry) => geometry.dispose());
  pack.fineLines.forEach((geometry) => geometry.dispose());
}
