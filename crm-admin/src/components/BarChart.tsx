"use client";

import { useId, useState } from "react";

export type BarChartPoint = {
  label: string;
  value: number;
};

type BarChartProps = {
  title: string;
  data: BarChartPoint[];
  color: string;
  formatValue?: (value: number) => string;
  emptyMessage?: string;
};

const VIEW_W = 640;
const VIEW_H = 220;
const MARGIN_LEFT = 56;
const MARGIN_RIGHT = 8;
const MARGIN_TOP = 12;
const MARGIN_BOTTOM = 28;
const MAX_BAR_WIDTH = 24;
const CORNER_RADIUS = 4;

function niceMax(value: number): number {
  if (value <= 0) return 10;
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  let niceFraction: number;
  if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;
  return niceFraction * 10 ** exponent;
}

function roundedTopBarPath(x: number, yTop: number, width: number, height: number) {
  if (height <= 0) return "";
  const r = Math.min(CORNER_RADIUS, width / 2, height);
  const yBottom = yTop + height;
  return `M ${x} ${yBottom}
    L ${x} ${yTop + r}
    Q ${x} ${yTop} ${x + r} ${yTop}
    L ${x + width - r} ${yTop}
    Q ${x + width} ${yTop} ${x + width} ${yTop + r}
    L ${x + width} ${yBottom}
    Z`;
}

function defaultFormat(v: number) {
  return v.toLocaleString("es-CR");
}

export default function BarChart({
  title,
  data,
  color,
  formatValue = defaultFormat,
  emptyMessage = "Sin datos en este período.",
}: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [tableView, setTableView] = useState(false);
  const gradientId = useId();

  const hasData = data.some((d) => d.value > 0);
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));

  const plotW = VIEW_W - MARGIN_LEFT - MARGIN_RIGHT;
  const plotH = VIEW_H - MARGIN_TOP - MARGIN_BOTTOM;
  const slotW = data.length > 0 ? plotW / data.length : plotW;
  const barW = Math.min(MAX_BAR_WIDTH, Math.max(4, slotW - 10));

  const ticks = [0, max / 2, max];

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-200">{title}</h3>
        <button
          type="button"
          onClick={() => setTableView((v) => !v)}
          className="text-xs text-neutral-500 underline decoration-dotted hover:text-neutral-300"
        >
          {tableView ? "Ver gráfica" : "Ver tabla"}
        </button>
      </div>

      {!hasData ? (
        <p className="py-10 text-center text-sm text-neutral-500">{emptyMessage}</p>
      ) : tableView ? (
        <table className="w-full text-left text-sm">
          <thead className="text-neutral-500">
            <tr>
              <th className="py-1 pr-4 font-medium">Mes</th>
              <th className="py-1 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-t border-neutral-800">
                <td className="py-1.5 pr-4 text-neutral-300">{d.label}</td>
                <td className="py-1.5 font-medium text-neutral-100" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatValue(d.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full" role="img" aria-label={title}>
            {ticks.map((t, i) => {
              const y = MARGIN_TOP + plotH - (t / max) * plotH;
              return (
                <g key={i}>
                  <line
                    x1={MARGIN_LEFT}
                    x2={VIEW_W - MARGIN_RIGHT}
                    y1={y}
                    y2={y}
                    stroke="#2c2c2a"
                    strokeWidth={1}
                  />
                  <text x={MARGIN_LEFT - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#898781">
                    {formatValue(t)}
                  </text>
                </g>
              );
            })}

            {data.map((d, i) => {
              const slotX = MARGIN_LEFT + i * slotW;
              const barX = slotX + (slotW - barW) / 2;
              const barH = (d.value / max) * plotH;
              const barY = MARGIN_TOP + plotH - barH;
              const isHovered = hovered === i;

              return (
                <g key={d.label}>
                  <path
                    d={roundedTopBarPath(barX, barY, barW, barH)}
                    fill={isHovered ? `url(#${gradientId})` : color}
                    opacity={isHovered ? 1 : 0.92}
                  />
                  <text
                    x={slotX + slotW / 2}
                    y={VIEW_H - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#898781"
                  >
                    {d.label}
                  </text>
                  {/* hit target, bigger than the bar itself */}
                  <rect
                    x={slotX}
                    y={MARGIN_TOP}
                    width={slotW}
                    height={plotH}
                    fill="transparent"
                    tabIndex={0}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(i)}
                    onBlur={() => setHovered(null)}
                  />
                </g>
              );
            })}

            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0.75} />
              </linearGradient>
            </defs>
          </svg>

          {hovered !== null && data[hovered] && (
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-xs shadow-lg"
              style={{
                left: `${((MARGIN_LEFT + hovered * slotW + slotW / 2) / VIEW_W) * 100}%`,
                top: `${((MARGIN_TOP + plotH - (data[hovered].value / max) * plotH) / VIEW_H) * 100}%`,
              }}
            >
              <div className="font-semibold text-white">{formatValue(data[hovered].value)}</div>
              <div className="text-neutral-400">{data[hovered].label}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
