const EARTH_RADIUS_KM = 6371;

export function calculateDistanceKm(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number
): number {
  const deltaLatitude = toRadians(toLatitude - fromLatitude);
  const deltaLongitude = toRadians(toLongitude - fromLongitude);
  const fromLatRad = toRadians(fromLatitude);
  const toLatRad = toRadians(toLatitude);

  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(fromLatRad) * Math.cos(toLatRad) * Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2);

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
