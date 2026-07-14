import type { ReserveQualityTier } from '../reserveQuality';

export type GoalObjectTransitionState = 'idle' | 'entering' | 'exiting';

export type GoalObjectProps = {
  progress: number;
  quality: ReserveQualityTier;
  reducedMotion: boolean;
  transitionState: GoalObjectTransitionState;
};
