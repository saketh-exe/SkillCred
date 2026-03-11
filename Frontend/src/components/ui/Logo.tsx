import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** The SkillCred brand mark — four accent-coloured squares in a 2×2 grid. */
const Logo: React.FC<LogoProps> = ({ size = 22, className, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 22 22"
    fill="none"
    className={className}
    style={style}
    aria-label="SkillCred logo"
  >
    <rect x="1"  y="1"  width="9" height="9" rx="2" fill="var(--accent)" />
    <rect x="12" y="1"  width="9" height="9" rx="2" fill="var(--accent)" opacity="0.4" />
    <rect x="1"  y="12" width="9" height="9" rx="2" fill="var(--accent)" opacity="0.4" />
    <rect x="12" y="12" width="9" height="9" rx="2" fill="var(--accent)" opacity="0.7" />
  </svg>
);

export default Logo;
