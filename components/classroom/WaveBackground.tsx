const RIBBONS = [
  {
    className: "ribbon-float-a",
    gradient: "ribbon-a",
    fill: "M-200,700 C200,520 520,820 880,620 S1380,340 1700,420 L1700,1000 L-200,1000 Z",
    edge: "M-200,700 C200,520 520,820 880,620 S1380,340 1700,420",
  },
  {
    className: "ribbon-float-b",
    gradient: "ribbon-b",
    fill: "M-200,790 C260,640 600,880 980,720 S1420,500 1700,560 L1700,1000 L-200,1000 Z",
    edge: "M-200,790 C260,640 600,880 980,720 S1420,500 1700,560",
  },
];

export function WaveBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#e6f3ff] via-[#f3f8ff] to-[#f5f2ff]"
    >

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="ribbon-a" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a9edd" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#7fb6ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ribbon-b" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9bb8ff" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#c9d6ff" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id="ribbon-soft" x="-10%" y="-20%" width="120%" height="140%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id="ribbon-edge" x="-5%" y="-20%" width="110%" height="140%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        {RIBBONS.map((ribbon) => (
          <g key={ribbon.gradient} className={ribbon.className}>
            <path d={ribbon.fill} fill={`url(#${ribbon.gradient})`} filter="url(#ribbon-soft)" />
            <path
              d={ribbon.edge}
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.85"
              strokeWidth="2"
              filter="url(#ribbon-edge)"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
