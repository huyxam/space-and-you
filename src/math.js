export function noise(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export function orbitPosition(orbit, t, localAngle = 0, radialOffset = 0, heightOffset = 0) {
  const angle = orbit.baseAngle + localAngle + t * orbit.speed;
  const xRadius = orbit.xRadius + radialOffset;
  const zRadius = orbit.zRadius + radialOffset * 0.62;

  return [
    Math.cos(angle) * xRadius,
    orbit.y + heightOffset + Math.sin(t * orbit.floatSpeed + orbit.offset) * orbit.floatRange,
    Math.sin(angle) * zRadius,
  ];
}