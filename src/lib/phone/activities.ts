// Maps path distance to the graphic walker’s actions and flights.
import type { PathStop } from './story-path';

type Stop = Pick<PathStop, 'id' | 'x' | 'width' | 'gapBefore'>;
type Activity = 'walk' | 'travel' | 'teach' | 'sell' | 'present' | 'graduate';
type Flight = { start: number; end: number; route: string };

// The university move is the only animated flight. It crosses open space
// between the Delhi work and Halifax, rather than flying over a landmark.
export function flightsFor(stops: Stop[]): Flight[] {
  const university = stops.find(stop => stop.id === 'university')!;
  return [{ start: university.x - (university.gapBefore ?? 0) + 80, end: university.x - 100, route: 'Delhi to Halifax' }];
}

export function hopsFor(stops: Stop[]): number[] {
  const x = (id: string) => stops.find(stop => stop.id === id)!.x;
  return [x('delhi') + 254];
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
export function activityAt(distance: number, stops: Stop[], reduced = false) {
  const journey = flightsFor(stops)[0];
  const stop = [...stops].reverse().find(stop => distance >= stop.x + 65) ?? stops[0];
  const local = distance - stop.x;
  const activity: Activity = stop.id === 'shiftkey' ? 'teach'
    : stop.id === 'graduation' ? 'graduate'
    : stop.id === 'collect' ? 'present'
    : stop.id === 'floqer' && local > 150 && local < 235 ? 'present'
    : stop.id === 'bean' || stop.id === 'floqer' || stop.id === 'webcube' ? 'sell'
    : 'walk';
  const universityEntry = stops.find(stop => stop.id === 'university')!.x + 65;
  const travelling = distance >= journey.start - 55 && distance < universityEntry;
  const flight = !reduced && distance > journey.start && distance < journey.end ? journey : undefined;
  const progress = flight ? (distance - flight.start) / (flight.end - flight.start) : 0;
  const boarding = flight ? smooth(progress / 0.06) * smooth((1 - progress) / 0.08) : 0;
  const climb = smooth((progress - 0.07) / 0.25);
  const descent = smooth((progress - 0.70) / 0.24);
  const altitude = flight ? 100 * climb * (1 - descent) : 0;
  const pitch = flight ? -8 * Math.sin(Math.PI * clamp((progress - 0.07) / 0.25))
    + 5 * Math.sin(Math.PI * clamp((progress - 0.70) / 0.24)) : 0;
  const nearestHop = hopsFor(stops).find(x => Math.abs(distance - x) < 42);
  const hopProgress = nearestHop === undefined ? 0 : (distance - nearestHop + 42) / 84;
  const hop = !reduced && nearestHop !== undefined ? Math.sin(Math.PI * hopProgress) ** 2 * 12 : 0;
  return { activity: travelling ? 'travel' as const : activity, flight, boarding, altitude, pitch, gear: 1 - smooth(altitude / 35), hop };
}
