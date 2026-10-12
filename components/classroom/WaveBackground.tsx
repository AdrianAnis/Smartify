const HEIGHT = 400;
const PERIODS = 4;

function buildWave(period: number, amplitude: number, baseline: number) {
  const half = period / 2;
  let d = `M0,${baseline}`;
  for (let i = 0; i < PERIODS; i++) {
    const x = i * period;
    d += ` C${x + half * 0.35},${baseline - amplitude * 1.35} ${x + half * 0.65},${baseline - amplitude * 1.35} ${x + half},${baseline}`;
    d += ` C${x + half * 1.35},${baseline + amplitude * 1.35} ${x + half * 1.65},${baseline + amplitude * 1.35} ${x + period},${baseline}`;
  }
  const width = period * PERIODS;
  return { width, d: `${d} L${width},${HEIGHT} L0,${HEIGHT} Z` };
}

const LAYERS = [
  { className: "wave-drift-slow h-[46%] opacity-60", fill: "rgba(42, 158, 221, 0.16)", wave: buildWave(900, 60, 150) },
  { className: "wave-drift-mid h-[38%] opacity-70", fill: "rgba(42, 158, 221, 0.2)", wave: buildWave(700, 50, 190) },
  { className: "wave-drift-fast h-[28%]", fill: "rgba(42, 158, 221, 0.26)", wave: buildWave(520, 36, 230) },
];

export function WaveBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-[#eaf5fd] via-[#f3f9fe] to-white"
    >
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />
      {LAYERS.map((layer) => (
        <svg
          key={layer.className}
          className={`absolute bottom-0 left-0 w-[200%] ${layer.className}`}
          viewBox={`0 0 ${layer.wave.width} ${HEIGHT}`}
          preserveAspectRatio="none"
        >
          <path d={layer.wave.d} fill={layer.fill} />
        </svg>
      ))}
    </div>
  );
}
