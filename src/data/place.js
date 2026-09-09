// Single source for the survey coordinate line.
//
// Columbus, Ohio sits at 39.9612° N, 82.9988° W. The site previously carried
// "82.99°W" in five separate files — the longitude truncated rather than rounded,
// and duplicated in a way that let it drift. On a cartographic-themed site the
// coordinate is content, so it lives here and is interpolated everywhere.

export const PLACE = {
  city: "Columbus",
  state: "Ohio",
  latitude: 39.9612,
  longitude: -82.9988,
};

/** "39.96°N 83.00°W" — rounded, not truncated, to two decimal places. */
export const COORDINATES = `${PLACE.latitude.toFixed(2)}°N ${Math.abs(
  PLACE.longitude
).toFixed(2)}°W`;

/** "39.96°N 83.00°W · COLUMBUS, OHIO · EDITION 2026" — the frontispiece overline. */
export const coordinateOverline = (edition = new Date().getFullYear()) =>
  `${COORDINATES} · ${PLACE.city.toUpperCase()}, ${PLACE.state.toUpperCase()} · EDITION ${edition}`;
