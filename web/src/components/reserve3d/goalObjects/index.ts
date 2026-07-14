import type { ComponentType } from 'react';
import { isGoalCategory } from '../../../lib/goalCategories';
import type { GoalCategory } from '../../../types';
import { CarGoalObject } from './CarGoalObject';
import { EducationGoalObject } from './EducationGoalObject';
import { GiftGoalObject } from './GiftGoalObject';
import { HomeGoalObject } from './HomeGoalObject';
import { OtherGoalObject } from './OtherGoalObject';
import { TechGoalObject } from './TechGoalObject';
import { TravelGoalObject } from './TravelGoalObject';
import type { GoalObjectProps } from './types';

export const GOAL_OBJECT_COMPONENTS = {
  car: CarGoalObject,
  travel: TravelGoalObject,
  tech: TechGoalObject,
  gift: GiftGoalObject,
  home: HomeGoalObject,
  education: EducationGoalObject,
  other: OtherGoalObject,
} satisfies Record<GoalCategory, ComponentType<GoalObjectProps>>;

export function getGoalObjectComponent(value: unknown): ComponentType<GoalObjectProps> {
  return GOAL_OBJECT_COMPONENTS[isGoalCategory(value) ? value : 'other'];
}

export type { GoalObjectProps, GoalObjectTransitionState } from './types';
