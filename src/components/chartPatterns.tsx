import type { Category, PatternKind } from "../types";
import { patternId } from "./patternId";

const OVERLAY = "#ffffff";

function overlay(kind: PatternKind) {
  const common = { stroke: OVERLAY, strokeOpacity: 0.7, strokeWidth: 1.6 };
  switch (kind) {
    case "diag":
      return <path d="M-2 2 L2 -2 M0 8 L8 0 M6 10 L10 6" {...common} />;
    case "diag-rev":
      return <path d="M-2 6 L2 10 M0 0 L8 8 M6 -2 L10 2" {...common} />;
    case "dots":
      return <circle cx="4" cy="4" r="1.5" fill={OVERLAY} fillOpacity={0.75} />;
    case "cross":
      return <path d="M4 0 V8 M0 4 H8" {...common} strokeWidth={1.2} />;
    case "horiz":
      return <path d="M0 2 H8 M0 6 H8" {...common} strokeWidth={1.2} />;
    case "vert":
      return <path d="M2 0 V8 M6 0 V8" {...common} strokeWidth={1.2} />;
    case "checks":
      return (
        <>
          <rect
            x="0"
            y="0"
            width="4"
            height="4"
            fill={OVERLAY}
            fillOpacity={0.55}
          />
          <rect
            x="4"
            y="4"
            width="4"
            height="4"
            fill={OVERLAY}
            fillOpacity={0.55}
          />
        </>
      );
    case "solid":
    default:
      return null;
  }
}

/** One <pattern> per category: its color plus a texture, so slices differ without relying on hue. */
export function PatternDefs({ categories }: { categories: Category[] }) {
  return (
    <defs>
      {categories.map((category) => (
        <pattern
          key={category.id}
          id={patternId(category)}
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <rect width="8" height="8" fill={category.color} />
          {overlay(category.pattern)}
        </pattern>
      ))}
    </defs>
  );
}

/** Small legend swatch that uses the same pattern as the chart slice. */
export function Swatch({ category }: { category: Category }) {
  return (
    <svg
      className="swatch"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="0.75"
        y="0.75"
        width="16.5"
        height="16.5"
        rx="4"
        fill={`url(#${patternId(category)})`}
        stroke="rgba(23, 35, 31, 0.35)"
        strokeWidth="1"
      />
    </svg>
  );
}
