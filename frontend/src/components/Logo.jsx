// InsuriFyx SVG Logo component
export default function Logo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shield background */}
      <path
        d="M20 3L5 9.5V20C5 28.5 11.5 36 20 38C28.5 36 35 28.5 35 20V9.5L20 3Z"
        fill="url(#shield_gradient)"
      />
      {/* Inner shield highlight */}
      <path
        d="M20 7L9 12.5V20C9 26.5 13.5 32.5 20 34.5C26.5 32.5 31 26.5 31 20V12.5L20 7Z"
        fill="white"
        fillOpacity="0.15"
      />
      {/* Lightning bolt / gig symbol */}
      <path
        d="M22 13H17L15 21H19L17 27L25 18H21L22 13Z"
        fill="white"
        fillOpacity="0.95"
      />
      <defs>
        <linearGradient id="shield_gradient" x1="5" y1="3" x2="35" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
    </svg>
  );
}
