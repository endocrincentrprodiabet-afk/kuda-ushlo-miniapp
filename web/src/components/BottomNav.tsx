import type { Screen } from '../types';

type BottomNavProps = {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
};

const items: Array<{ screen: Screen; label: string }> = [
  { screen: 'home', label: 'Главная' },
  { screen: 'add', label: 'Добавить' },
  { screen: 'history', label: 'История' },
  { screen: 'reserve', label: 'Запас' },
  { screen: 'settings', label: 'Настройки' },
];

export function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {items.map((item) => (
        <button
          className={item.screen === currentScreen ? 'nav-button active' : 'nav-button'}
          key={item.screen}
          onClick={() => onNavigate(item.screen)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
