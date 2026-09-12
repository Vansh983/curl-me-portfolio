// The split between what Blender bakes and what stays live at runtime. scripts/stage-bake.py
// keeps the same rules (is_live, DROP_*): a piece the runtime animates or paints is built by the
// runtime and lit by the live lights; everything else comes back from Blender with a lightmap.
import type { Placement } from './sets.ts';

/** The lightmap stores irradiance divided by this; the runtime multiplies it back. Same as SCALE in stage-bake.py. */
export const LM_SCALE = 4;

/** Built pieces by material that keep moving or glowing on their own clock. */
export const LIVE_SURFACE = new Set(['mat:tubeGlass', 'mat:bulb', 'mat:curtain', 'mat:cabinGlass', 'mat:handrail']);
/** Props that never enter the bake: the backdrops and the far things the fog softens anyway. */
export const DROP_PROP = new Set(['clouds', 'bridge', 'boats', 'piers', 'nightSky', 'sky', 'city', 'water', 'flightSky', 'campusView', 'sydneyHarbour', 'harbourWater', 'bennelongPoint', 'harbourAround', 'canadaPlaceSails', 'cnTowerFar', 'macdonaldBridge', 'northShore', 'torontoDay', 'halifaxDay']);
/** Things that stand in the Blender scene for shadow and bounce but are not baked: the wide ground that would eat the atlas, and leafy models whose alpha cards do not survive the round trip. The runtime builds them and lights them live. */
export const CONTEXT_PROP = new Set(['plazaFloor', 'road']);
export const CONTEXT_MODEL = new Set(['palm_medium', 'island_tree_01']);

/** `surface` is `mat:<name>` or `paint:<name>`; `live` is the placement's live flag or ''. */
export function pieceIsLive(surface: string, live: string): boolean {
  if (surface.startsWith('paint:')) return true; // a painted face is a thin quad on a board: baking it from the wrong side blackens it
  if (LIVE_SURFACE.has(surface)) return true;
  return live === 'fan' || live === 'door' || live === 'drop' || live === 'flight';
}

/** Whether a placement has anything for the runtime to build in a baked set. */
export function placementIsLive(p: Placement): boolean {
  if (p.build && (DROP_PROP.has(p.build) || CONTEXT_PROP.has(p.build))) return true;
  if (p.model && CONTEXT_MODEL.has(p.model)) return true;
  if (p.live === 'city' || p.live === 'sky' || p.live === 'water' || p.live === 'fan' || p.live === 'door' || p.live === 'drop' || p.live === 'flight') return true;
  if (p.live === 'tv' || p.live === 'monitor' || p.live === 'screen' || p.live === 'tube' || p.live === 'bulb' || p.live === 'curtain') return true;
  return false;
}

export interface BakedName { kind: 'b' | 'm' | 's'; prop: string; surface: string; live: string }

/** Reads the name the runtime gave a mesh before the bake (`kind|prop|surface|live`, Blender may add `.001`). */
export function parseBakedName(name: string): BakedName | null {
  const parts = name.replace(/\.\d{3}$/, '').split('|');
  if (parts.length < 4 || !['b', 'm', 's'].includes(parts[0])) return null;
  return { kind: parts[0] as BakedName['kind'], prop: parts[1], surface: parts[2], live: parts[3] };
}
