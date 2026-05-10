"use client";

import { useState, useMemo, useRef } from "react";
import type { SimResult, BenchmarkVisibility, MoneyFormatter } from "@/lib/types";

export const BENCHMARK_META: Record<
  string,
  { label: string; color: string; desc: string }
> = {
  coast: { label: "Coast", color: "#a78bfa", desc: "Stop contributing; compound to target by 65" },
  barista: { label: "Barista", color: "#7dd3fc", desc: "Half target — supplement w/ part-time work" },
  lean: { label: "Lean", color: "#3eb6e8", desc: "70% of target — minimalist retirement" },
  chubby: { label: "Chubby", color: "#cd8cf3", desc: "100% of target — comfortable retirement" },
  fat: { label: "Fat", color: "#f59e0b", desc: "150% of target — luxury retirement" },
};

function niceCeil(n: number): number {
  if (n <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(n)));
  const mant = n / exp;
  const niceMant = mant <= 1 ? 1 : mant <= 2 ? 2 : mant <= 5 ? 5 : 10;
  return niceMant * exp;
}

function HoverTip({
  x,
  year,
  age,
  netWorth,
  target,
  money,
  containerW,
}: {
  x: number;
  year: number;
  age: number;
  netWorth: number;
  target: number;
  money: MoneyFormatter;
  containerW: number;
  y?: number;
}) {
  const left = `${(x / containerW) * 100}%`;
  const align = x / containerW > 0.7 ? "right" : "left";
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: 0,
        left,
        transform: align === "right" ? "translate(-100%, 0)" : "translate(0, 0)",
      }}
    >
      <div
        className="bg-ink text-white rounded-2xl px-3.5 py-2.5 shadow-pop fade-in"
        style={{ minWidth: 160 }}
      >
        <div className="text-[10px] font-mono tracking-widest text-white/60 uppercase">
          Year +{year} · Age {age} · {new Date().getFullYear() + year}
        </div>
        <div className="font-display text-[24px] leading-none mt-1">
          {money(netWorth, { compact: true })}
        </div>
        <div className="text-[11px] text-white/70 mt-1.5">
          {netWorth >= target
            ? "✓ Past FIRE target"
            : `${((netWorth / target) * 100).toFixed(0)}% to target`}
        </div>
      </div>
    </div>
  );
}

export function FireChart({
  sim,
  data,
  money,
  currentAge,
  onActivateBenchmark,
}: {
  sim: SimResult;
  data: { benchmarks: BenchmarkVisibility };
  money: MoneyFormatter;
  currentAge: number;
  onActivateBenchmark?: (key: string) => void;
}) {
  const W = 820,
    H = 320,
    PAD_L = 78,
    PAD_R = 28,
    PAD_T = 24,
    PAD_B = 38;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const containerRef = useRef<HTMLDivElement>(null);

  const [hover, setHover] = useState<{ i: number } | null>(null);

  const series = sim.netWorthSeries;
  const fullHorizon = sim.horizon;
  const benchmarks = data.benchmarks;

  const fatTarget = sim.benchmarks.fat.value;
  const yMaxRaw =
    isFinite(fatTarget) && fatTarget > 0
      ? fatTarget * 1.1
      : Math.max(...series, 1);
  const yMax = niceCeil(yMaxRaw);
  const yMin = Math.min(0, ...series);

  let lastShownIdx = fullHorizon.length - 1;
  for (let i = 0; i < series.length; i++) {
    if (series[i] >= yMax) {
      lastShownIdx = Math.min(fullHorizon.length - 1, i + 3);
      break;
    }
  }
  lastShownIdx = Math.max(lastShownIdx, Math.min(10, fullHorizon.length - 1));
  const horizon = fullHorizon.slice(0, lastShownIdx + 1);

  const xScale = (i: number) => PAD_L + (i / Math.max(1, horizon.length - 1)) * innerW;
  const yScale = (v: number) =>
    PAD_T + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const pathD = useMemo(() => {
    if (horizon.length === 0) return "";
    let d = `M ${xScale(0)} ${yScale(series[0])}`;
    for (let i = 1; i < horizon.length; i++) {
      const x0 = xScale(i - 1),
        y0 = yScale(series[i - 1]);
      const x1 = xScale(i),
        y1 = yScale(series[i]);
      const cx = (x0 + x1) / 2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, horizon.length, yMax, yMin]);

  const areaD =
    pathD +
    ` L ${xScale(horizon.length - 1)} ${yScale(yMin)} L ${xScale(0)} ${yScale(yMin)} Z`;

  const lastIdx = horizon.length - 1;
  const tickStep =
    lastIdx > 60 ? 15 : lastIdx > 30 ? 10 : lastIdx > 15 ? 5 : 2;
  const tickYears: number[] = [];
  for (let y = 0; y <= lastIdx; y += tickStep) tickYears.push(y);
  if (tickYears[tickYears.length - 1] !== lastIdx) tickYears.push(lastIdx);

  const yTickCount = 5;
  const yTicks = Array.from(
    { length: yTickCount + 1 },
    (_, i) => yMin + ((yMax - yMin) * i) / yTickCount
  );

  function handleMove(e: React.MouseEvent) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const ratio =
      (px - (PAD_L * rect.width) / W) / ((innerW * rect.width) / W);
    const i = Math.round(ratio * (horizon.length - 1));
    if (i < 0 || i >= horizon.length) {
      setHover(null);
      return;
    }
    setHover({ i });
  }

  const bmItems = (
    Object.entries(benchmarks) as [string, boolean][]
  )
    .map(([key, on]) => {
      if (!on) return null;
      const bm = sim.benchmarks[key as keyof typeof sim.benchmarks];
      const value = key === "coast" ? (bm as { coastNeed: number }).coastNeed : (bm as { value: number }).value;
      if (value > yMax || isNaN(value)) return null;
      return { key, value, yr: bm.yearsReached, meta: BENCHMARK_META[key] };
    })
    .filter(Boolean)
    .sort((a, b) => a!.value - b!.value) as NonNullable<{
      key: string;
      value: number;
      yr: number | null;
      meta: { label: string; color: string };
    }>[];

  const minGap = 14;
  const labelY = bmItems.map((it) => yScale(it.value) - 6);
  for (let i = labelY.length - 2; i >= 0; i--) {
    if (labelY[i] - labelY[i + 1] < minGap) {
      labelY[i] = labelY[i + 1] + minGap;
    }
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto chart-area select-none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#91e0ff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#91e0ff" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="areaStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3eb6e8" />
            <stop offset="100%" stopColor="#cd8cf3" />
          </linearGradient>
        </defs>

        {yTicks.map((v, idx) => (
          <line
            key={idx}
            x1={PAD_L}
            x2={W - PAD_R}
            y1={yScale(v)}
            y2={yScale(v)}
            stroke="#e7e3df"
            strokeWidth="1"
          />
        ))}

        <path d={areaD} fill="url(#areaFill)" />
        <path
          d={pathD}
          fill="none"
          stroke="url(#areaStroke)"
          strokeWidth="2.25"
          strokeLinecap="round"
        />

        {bmItems.map((it, i) => (
          <g key={it.key}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yScale(it.value)}
              y2={yScale(it.value)}
              stroke={it.meta.color}
              strokeWidth="1.4"
              className="benchmark-line"
              opacity="0.85"
            />
            {Math.abs(labelY[i] - (yScale(it.value) - 6)) > 1 ? (
              <line
                x1={W - PAD_R - 4}
                x2={W - PAD_R - 4}
                y1={yScale(it.value)}
                y2={labelY[i] + 4}
                stroke={it.meta.color}
                strokeWidth="1"
                opacity="0.4"
              />
            ) : null}
            <text
              x={W - PAD_R - 4}
              y={labelY[i]}
              textAnchor="end"
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
              fill={it.meta.color}
              fontWeight="600"
            >
              {it.meta.label.toUpperCase()} · {money(it.value, { compact: true })}
            </text>
            {it.yr !== null && it.yr <= horizon.length - 1 ? (
              <g
                onMouseEnter={() => onActivateBenchmark?.(it.key)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={xScale(it.yr)}
                  cy={yScale(it.value)}
                  r="5"
                  fill={it.meta.color}
                  stroke="#fff"
                  strokeWidth="2"
                />
              </g>
            ) : null}
          </g>
        ))}

        {tickYears.map((y) => (
          <g key={y}>
            <line
              x1={xScale(y)}
              x2={xScale(y)}
              y1={H - PAD_B}
              y2={H - PAD_B + 4}
              stroke="#999"
            />
            <text
              x={xScale(y)}
              y={H - PAD_B + 18}
              textAnchor="middle"
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
              fill="#737373"
            >
              {y === 0 ? "TODAY" : `+${y} YR`}
            </text>
            <text
              x={xScale(y)}
              y={H - PAD_B + 30}
              textAnchor="middle"
              fontSize="9.5"
              fontFamily="JetBrains Mono, monospace"
              fill="#a3a3a3"
            >
              age {currentAge + y}
            </text>
          </g>
        ))}

        {yTicks.map((v, idx) => (
          <text
            key={idx}
            x={PAD_L - 8}
            y={yScale(v) + 4}
            textAnchor="end"
            fontSize="10.5"
            fontFamily="JetBrains Mono, monospace"
            fill="#737373"
          >
            {money(v, { compact: true })}
          </text>
        ))}

        <text
          x={-H / 2}
          y={16}
          transform="rotate(-90)"
          textAnchor="middle"
          fontSize="10"
          fontFamily="JetBrains Mono, monospace"
          fill="#737373"
          letterSpacing="0.06em"
        >
          NET WORTH
        </text>

        {hover ? (
          <g pointerEvents="none">
            <line
              x1={xScale(hover.i)}
              x2={xScale(hover.i)}
              y1={PAD_T}
              y2={H - PAD_B}
              stroke="#000"
              strokeWidth="1"
              strokeDasharray="2 3"
              opacity="0.4"
            />
            <circle
              cx={xScale(hover.i)}
              cy={yScale(series[hover.i])}
              r="6"
              fill="#fff"
              stroke="#000"
              strokeWidth="2"
            />
          </g>
        ) : null}
      </svg>

      {hover ? (
        <HoverTip
          containerW={820}
          x={xScale(hover.i)}
          y={0}
          year={hover.i}
          age={currentAge + hover.i}
          netWorth={sim.netWorthSeries[hover.i]}
          target={sim.target}
          money={money}
        />
      ) : null}
    </div>
  );
}
