type CarGoalFallbackVisualProps = {
  progress: number;
};

export function CarGoalFallbackVisual({ progress }: CarGoalFallbackVisualProps) {
  const visualProgress = Math.max(0, Math.min(1, progress));
  const shellOpacity = 0.84 + visualProgress * 0.12;
  const wireOpacity = 0.05 + visualProgress * 0.08;
  const detailOpacity = 0.24 + visualProgress * 0.3;

  return (
    <svg className="reserve-car-fallback" viewBox="0 0 360 220" role="presentation">
      <defs>
        <linearGradient id="car-fallback-shell" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#1b2b2a" />
          <stop offset="1" stopColor="#090f11" />
        </linearGradient>
        <linearGradient id="car-fallback-glass" x1="0" x2="1">
          <stop offset="0" stopColor="#193335" />
          <stop offset="1" stopColor="#0b1719" />
        </linearGradient>
      </defs>

      <ellipse className="reserve-car-fallback__podium" cx="181" cy="192" rx="111" ry="13" />
      <ellipse className="reserve-car-fallback__podium-ring" cx="181" cy="189" rx="78" ry="8" />

      <path
        className="reserve-car-fallback__shell"
        d="M34 143C35 122 50 108 82 98L139 80C151 57 177 44 211 44C246 44 267 61 284 89L315 101C327 108 333 125 327 141L311 151L291 151C287 128 273 116 254 116C235 116 222 129 219 151L129 154C125 130 110 117 90 118C69 119 56 133 53 153L39 151Z"
        fill="url(#car-fallback-shell)"
        opacity={shellOpacity}
      />

      <g className="reserve-car-fallback__glass" opacity={0.52 + visualProgress * 0.2}>
        <path d="M148 80L174 53C185 48 196 47 207 48L195 81Z" fill="url(#car-fallback-glass)" />
        <path d="M202 82L213 49C237 51 254 64 269 86Z" fill="url(#car-fallback-glass)" />
      </g>

      <g className="reserve-car-fallback__wire" opacity={wireOpacity}>
        <path d="M34 143C35 122 50 108 82 98L139 80C151 57 177 44 211 44C246 44 267 61 284 89L315 101C327 108 333 125 327 141" />
        <path d="M39 151L53 153C56 133 69 119 90 118C110 117 125 130 129 154L219 151C222 129 235 116 254 116C273 116 287 128 291 151L311 151" />
        <path d="M82 98C140 91 218 87 284 89" />
        <path d="M139 80L195 81L269 86" />
        <path d="M148 80L174 53L211 44L213 49L202 82" />
        <path d="M83 99L121 119L128 153" />
        <path d="M139 80L165 101L129 117" />
        <path d="M195 81L218 104L202 122" />
        <path d="M269 86L254 116L284 108L315 101" />
        <path d="M129 154L166 124L219 151" />
        <path d="M39 143L82 119L53 153" />
      </g>

      <g className="reserve-car-fallback__details" opacity={detailOpacity}>
        <path d="M205 88L219 101L218 143L151 145L143 100L165 84" />
        <path d="M218 101L265 95" />
        <path d="M143 100L83 107" />
        <path d="M151 145L218 143" />
        <path d="M222 89L217 109" />
        <path d="M220 116L235 116" />
        <path d="M289 103L316 110L322 130" />
        <path d="M54 131L46 145L78 148" />
      </g>

      <g className="reserve-car-fallback__front" opacity={0.58 + visualProgress * 0.3}>
        <path d="M39 120C50 110 67 104 87 100L86 129C67 132 51 139 40 147Z" />
        <path d="M45 123L78 113L79 130L47 139Z" />
        <path d="M51 123L50 136M58 120L57 134M66 118L65 132M74 115L73 130" />
        <ellipse cx="91" cy="108" rx="8" ry="7" />
        <ellipse cx="108" cy="103" rx="7" ry="6" />
        <ellipse cx="72" cy="114" rx="7" ry="6" />
        <ellipse cx="58" cy="119" rx="6" ry="5" />
      </g>

      <g className="reserve-car-fallback__wheel reserve-car-fallback__wheel--rear">
        <ellipse cx="255" cy="148" rx="28" ry="31" />
        <ellipse cx="255" cy="148" rx="19" ry="21" />
        <path d="M255 127V169M236 148H274M242 133L268 163M268 133L242 163" />
      </g>
      <g className="reserve-car-fallback__wheel reserve-car-fallback__wheel--front">
        <ellipse cx="90" cy="150" rx="32" ry="35" />
        <ellipse cx="90" cy="150" rx="21" ry="23" />
        <path d="M90 127V173M69 150H111M75 134L105 166M105 134L75 166" />
      </g>
    </svg>
  );
}
