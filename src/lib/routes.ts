import type { PilgrimageRoute, RouteStop, Spot } from '../types/data';

// route.days を跨いで stop を順序通りに1本の配列へ
export function flattenRouteStops(route: PilgrimageRoute): RouteStop[] {
  return route.days.flatMap((day) => day.stops);
}

// ルートの stop id 列を実スポットへ解決し、座標未確定のものは除外する
export function resolveRouteSpots(route: PilgrimageRoute, spots: Spot[]): Spot[] {
  const spotById = new Map(spots.map((s) => [s.id, s]));
  return flattenRouteStops(route)
    .map((stop) => spotById.get(stop.id))
    .filter((s): s is Spot => !!s && s.lat != null && s.lng != null);
}
