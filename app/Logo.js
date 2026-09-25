// Símbolo Livus: haste e base 1x, altura 4x, quadrado Signal 0,4x no encaixe (brand kit 04)
export function Symbol({ size = 24, reverse = false }) {
  const ink = reverse ? "#FEFBF2" : "#0A0A0A";
  return (<svg width={size * 0.78} height={size} viewBox="0 0 3.12 4" aria-hidden="true" style={{ display: "block" }}>
    <path d="M0 0H1V3H3.12V4H0Z" fill={ink} /><rect x="1" y="3" width="0.4" height="0.4" fill="#E5341F" /></svg>);
}
export function Wordmark({ size = 24 }) {
  return (<span className="wordmark" style={{ gap: size * 0.45 }}><Symbol size={size} /><span style={{ fontSize: size * 0.95 }}>livus</span></span>);
}
