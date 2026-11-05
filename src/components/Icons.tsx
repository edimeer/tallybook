import type { SVGProps } from "react";

/** Small stroke icons. They are decorative: any meaning is also given in text. */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const PlusIcon = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const PencilIcon = () => (
  <Icon>
    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
  </Icon>
);
export const TrashIcon = () => (
  <Icon>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Icon>
);
export const ChevronLeftIcon = () => (
  <Icon>
    <path d="m15 6-6 6 6 6" />
  </Icon>
);
export const ChevronRightIcon = () => (
  <Icon>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);
export const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-4.5-4.5" />
  </Icon>
);
export const CloseIcon = () => (
  <Icon>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);
export const ArrowUpIcon = () => (
  <Icon width="14" height="14" strokeWidth="2.5">
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Icon>
);
export const ArrowDownIcon = () => (
  <Icon width="14" height="14" strokeWidth="2.5">
    <path d="M12 5v14M6 13l6 6 6-6" />
  </Icon>
);
export const AlertIcon = () => (
  <Icon width="16" height="16">
    <path d="M12 4 3 20h18L12 4ZM12 10v4M12 17.5v.01" />
  </Icon>
);
export const InfoIcon = () => (
  <Icon width="16" height="16">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8v.01" />
  </Icon>
);
