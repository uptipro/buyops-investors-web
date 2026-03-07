import { SVGProps } from "react";

export const NairaSign = ({
  size,
  width,
  height,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number | string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size ?? width ?? 24}
    height={size ?? height ?? 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 4v16" />
    <path d="M19 4v16" />
    <path d="M5 4l14 16" />
    <path d="M3 9.5h18" />
    <path d="M3 14.5h18" />
  </svg>
);
