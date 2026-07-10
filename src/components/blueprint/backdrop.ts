/**
 * ONE pool-of-light for the whole drafting space. The page CSS gradient and
 * the in-GL fullscreen backdrop are both generated from these stops, so the
 * canvas cross-fade at the trace beat has NO seam — the machine floats in a
 * single continuous atmosphere instead of a card on a background (redesign
 * Phase 1, client critique #1).
 *
 * Geometry mirrors the original CSS: radial 50% x 42% centred at (50%, 40%).
 */
export const BACKDROP_STOPS: [number, string][] = [
  [0, "#0a141c"],
  [0.58, "#06090f"],
  [1, "#05080c"],
];

export const BACKDROP_CENTER = { x: 0.5, y: 0.4 }; // from the TOP, CSS-style
export const BACKDROP_RADII = { x: 0.5, y: 0.42 };

export const BACKDROP_CSS = `radial-gradient(${BACKDROP_RADII.x * 100}% ${BACKDROP_RADII.y * 100}% at ${
  BACKDROP_CENTER.x * 100
}% ${BACKDROP_CENTER.y * 100}%, ${BACKDROP_STOPS.map(([o, c]) => `${c} ${Math.round(o * 100)}%`).join(", ")})`;

/** '#0a141c' → [r,g,b] in 0..1 for shader uniforms. */
export function hexToVec3(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Fog wants one colour — the mid stop reads as the space's ambient tone. */
export const BACKDROP_FOG = BACKDROP_STOPS[1][1];
