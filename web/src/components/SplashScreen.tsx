type SplashScreenProps = {
  isLeaving: boolean;
};

export function SplashScreen({ isLeaving }: SplashScreenProps) {
  return (
    <div className={`splash-screen${isLeaving ? ' splash-screen--leaving' : ''}`} aria-label="Загрузка приложения">
      <div className="splash-content">
        <p className="splash-title">Куда ушло?</p>
        <p className="splash-subtitle">Мини-бюджет на каждый день</p>
        <div className="splash-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
