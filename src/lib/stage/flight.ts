// Scroll is the flight clock. No timers: rewinding and direct chapter jumps give the same view.
const ease = (v: number) => { const t = Math.max(0, Math.min(1, v)); return t * t * (3 - 2 * t); };
export const FLIGHT = { takeoff: 0.724, cruise: 0.741, descent: 0.756, landed: 0.777 } as const;
export const PHONE = { raise: 0.778, framed: 0.793, shutter: 0.797, zoom: 0.801, filled: 0.818, transfer: 0.822, resolved: 0.826, reveal: 0.830 } as const;
export const CLASSROOM_VIEW = { cam: [-0.65, 2.66, -2.55] as [number, number, number], look: [1.6, 1.35, -9.7] as [number, number, number], fov: 78 };
export const WINDOW_VIEW = { cam: [-4.3, 1.28, -6.55] as [number, number, number], look: [-7, 1.42, -6.1] as [number, number, number], fov: 74 };

export function phoneAt(progress: number, reducedMotion = false) {
  const q = Number.isFinite(progress) ? progress : 0;
  return {
    visible: !reducedMotion && q >= PHONE.raise && q < PHONE.reveal,
    raise: ease((q - PHONE.raise) / (PHONE.framed - PHONE.raise)),
    zoom: ease((q - PHONE.zoom) / (PHONE.filled - PHONE.zoom)),
    classroom: ease((q - PHONE.filled) / (PHONE.resolved - PHONE.filled)),
    flash: q < PHONE.shutter ? 0 : Math.max(0, 1 - (q - PHONE.shutter) / 0.0018),
  };
}

export function flightAt(progress: number, reducedMotion = false) {
  const q = Number.isFinite(progress) ? progress : 0;
  const up = ease((q - FLIGHT.takeoff) / (FLIGHT.cruise - FLIGHT.takeoff));
  const down = ease((q - FLIGHT.descent) / (FLIGHT.landed - FLIGHT.descent));
  const travel = ease((q - FLIGHT.takeoff) / (FLIGHT.landed - FLIGHT.takeoff));
  return {
    altitude: reducedMotion ? 0 : 65 * up * (1 - down),
    travel: reducedMotion ? 90 : travel * 90,
    arrived: reducedMotion || q >= FLIGHT.landed,
  };
}
