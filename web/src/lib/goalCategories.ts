import type { GoalCategory, GoalCategoryConfig } from '../types';

export const GOAL_CATEGORY_CONFIG: Record<GoalCategory, GoalCategoryConfig> = {
  car: { value: 'car', label: 'Автомобиль' },
  travel: { value: 'travel', label: 'Путешествие' },
  tech: { value: 'tech', label: 'Техника' },
  gift: { value: 'gift', label: 'Подарок' },
  home: { value: 'home', label: 'Дом' },
  education: { value: 'education', label: 'Образование' },
  other: { value: 'other', label: 'Другое' },
};

export const GOAL_CATEGORIES = Object.values(GOAL_CATEGORY_CONFIG);

export function isGoalCategory(value: unknown): value is GoalCategory {
  return typeof value === 'string' && Object.hasOwn(GOAL_CATEGORY_CONFIG, value);
}

export function getGoalCategoryConfig(value: unknown): GoalCategoryConfig {
  return GOAL_CATEGORY_CONFIG[isGoalCategory(value) ? value : 'other'];
}

export function getGoalCategoryLabel(value: unknown): string {
  return getGoalCategoryConfig(value).label;
}
