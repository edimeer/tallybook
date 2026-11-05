import type { CategorySpend } from "../lib/calculations";
import { formatMoney, formatMoneyWhole, formatPercent } from "../lib/money";
import type { Category } from "../types";
import { PatternDefs } from "./chartPatterns";
import { patternId } from "./patternId";

interface DonutChartProps {
  /** Every category that appears in the legend, so each gets its pattern defined. */
  categories: Category[];
  slices: CategorySpend[];
  totalCents: number;
  activeId: string | null;
}

const SIZE = 220;
const CENTER = SIZE / 2;
const OUTER = 100;
const INNER = 62;

function polar(radius: number, angle: number): [number, number] {
  // Angle 0 points up and grows clockwise.
  return [CENTER + radius * Math.sin(angle), CENTER - radius * Math.cos(angle)];
}

function slicePath(start: number, end: number): string {
  // A full circle cannot be drawn with one arc, so stop just short of 360 degrees.
  const safeEnd = Math.min(end, start + Math.PI * 2 - 0.0001);
  const large = safeEnd - start > Math.PI ? 1 : 0;
  const [x1, y1] = polar(OUTER, start);
  const [x2, y2] = polar(OUTER, safeEnd);
  const [x3, y3] = polar(INNER, safeEnd);
  const [x4, y4] = polar(INNER, start);
  return [
    `M ${x1} ${y1}`,
    `A ${OUTER} ${OUTER} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${INNER} ${INNER} 0 ${large} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}

/**
 * Hand-built SVG donut. The slices are decorative (the legend and table carry the
 * data), so the whole graphic is one labelled image with a text summary.
 */
export function DonutChart({
  categories,
  slices,
  totalCents,
  activeId,
}: DonutChartProps) {
  const paths = slices.map((slice, index) => {
    const before = slices.slice(0, index).reduce((sum, s) => sum + s.share, 0);
    return {
      slice,
      d: slicePath(before * Math.PI * 2, (before + slice.share) * Math.PI * 2),
    };
  });

  const active = slices.find((s) => s.category.id === activeId);
  const summary = slices
    .slice(0, 3)
    .map((s) => `${s.category.name} ${formatPercent(s.share)}`)
    .join(", ");

  return (
    <svg
      className="donut"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={`Spending by category, total ${formatMoney(totalCents)}. Largest: ${summary}.`}
    >
      <PatternDefs categories={categories} />
      {paths.map(({ slice, d }) => (
        <path
          key={slice.category.id}
          d={d}
          fill={`url(#${patternId(slice.category)})`}
          stroke="var(--bg)"
          strokeWidth="3"
          strokeLinejoin="round"
          opacity={activeId && activeId !== slice.category.id ? 0.35 : 1}
        />
      ))}
      <text
        x={CENTER}
        y={CENTER - 6}
        textAnchor="middle"
        className="donut__value"
      >
        {formatMoneyWhole(active ? active.amountCents : totalCents)}
      </text>
      <text
        x={CENTER}
        y={CENTER + 16}
        textAnchor="middle"
        className="donut__label"
      >
        {active ? active.category.name : "spent"}
      </text>
    </svg>
  );
}
