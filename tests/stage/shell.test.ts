import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildShell } from '../../src/lib/stage/shell.ts';
import { SETS } from '../../src/lib/stage/sets.ts';

const room = SETS[1].shell!;

const area = (s: { pos: Float32Array }) => {
  let a = 0;
  for (let i = 0; i < s.pos.length; i += 9) {
    const ax = s.pos[i + 3] - s.pos[i], ay = s.pos[i + 4] - s.pos[i + 1], az = s.pos[i + 5] - s.pos[i + 2];
    const bx = s.pos[i + 6] - s.pos[i], by = s.pos[i + 7] - s.pos[i + 1], bz = s.pos[i + 8] - s.pos[i + 2];
    a += 0.5 * Math.hypot(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx);
  }
  return a;
};

test('a shell is finite, closed above and below, and its uv is in metres', () => {
  const { floor, walls, ceiling } = buildShell(room);
  for (const s of [floor, walls, ceiling]) {
    assert.equal(s.pos.length % 9, 0);
    assert.equal(s.nor.length, s.pos.length);
    assert.equal(s.uv.length, (s.pos.length / 3) * 2);
    for (const v of s.pos) assert.ok(Number.isFinite(v));
  }
  const us = Array.from({ length: floor.uv.length / 2 }, (_, i) => floor.uv[i * 2]);
  assert.ok(Math.abs(Math.max(...us) - Math.min(...us) - (room.x[1] - room.x[0])) < 1e-6);
  assert.ok(Math.abs(area(floor) - (room.x[1] - room.x[0]) * (room.z[1] - room.z[0])) < 1e-4); // float32 positions
});

test('an opening removes wall area: a door leaves a hole you can walk through', () => {
  const solid = buildShell({ ...room, openings: [] });
  const cut = buildShell(room);
  const holes = room.openings.reduce((t, o) => t + o.w * o.h, 0);
  assert.ok(Math.abs(area(solid.walls) - area(cut.walls) - holes) < 1e-6, `${area(solid.walls)} - ${area(cut.walls)} vs ${holes}`);
  const door = room.openings.find((o) => (o.sill ?? 0) === 0)!;
  for (let i = 0; i < cut.walls.pos.length; i += 3) {
    const x = cut.walls.pos[i], y = cut.walls.pos[i + 1], z = cut.walls.pos[i + 2];
    const inside = Math.abs(x - room.x[1]) < 1e-9 && z > door.at - door.w / 2 + 1e-9 && z < door.at + door.w / 2 - 1e-9 && y > 1e-9 && y < door.h - 1e-9;
    assert.ok(!inside, `vertex in the door at ${x},${y},${z}`);
  }
});

test('every normal points into the room and every triangle winds toward it', () => {
  const { floor, walls, ceiling } = buildShell(room);
  const cx = (room.x[0] + room.x[1]) / 2, cy = room.h / 2, cz = (room.z[0] + room.z[1]) / 2;
  for (const s of [floor, walls, ceiling]) {
    for (let i = 0; i < s.pos.length; i += 3) {
      const dot = (cx - s.pos[i]) * s.nor[i] + (cy - s.pos[i + 1]) * s.nor[i + 1] + (cz - s.pos[i + 2]) * s.nor[i + 2];
      assert.ok(dot > 0, `normal at ${i / 3} faces out`);
    }
    for (let i = 0; i < s.pos.length; i += 9) {
      const ax = s.pos[i + 3] - s.pos[i], ay = s.pos[i + 4] - s.pos[i + 1], az = s.pos[i + 5] - s.pos[i + 2];
      const bx = s.pos[i + 6] - s.pos[i], by = s.pos[i + 7] - s.pos[i + 1], bz = s.pos[i + 8] - s.pos[i + 2];
      const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
      assert.ok(nx * s.nor[i] + ny * s.nor[i + 1] + nz * s.nor[i + 2] > 0, `triangle ${i / 9} winds away from its normal`);
    }
  }
});

test('an inner wall has two faces cut round its door, two jambs and a lintel, all facing out of the wall', () => {
  const { walls } = buildShell({ x: [0, 4], z: [0, 4], h: 2.8, floor: 'condoFloor', wall: 'condoWall', openings: [], walls: [{ from: [2, 0], to: [2, 4], t: 0.1, doors: [{ at: 1, w: 0.8, h: 2 }] }] });
  // the four outer walls are 4 rects (24 verts); the partition adds 2 faces x 3 rects, 2 jambs, 1 lintel = 9 rects
  assert.equal(walls.pos.length / 3, (4 + 9) * 6);
  // every partition vertex normal points away from x = 2 on its own side, or along z / down for the reveals
  for (let i = 24; i < walls.pos.length / 3; i++) {
    const x = walls.pos[i * 3], nx = walls.nor[i * 3], ny = walls.nor[i * 3 + 1], nz = walls.nor[i * 3 + 2];
    if (Math.abs(nx) > 0.5) assert.ok(Math.sign(nx) === Math.sign(x - 2), `face at x ${x} faces ${nx}`);
    else assert.ok(Math.abs(nz) > 0.5 || ny < -0.5, `reveal normal ${[nx, ny, nz]}`);
  }
});

test('a raised floor lifts the walls with it: every wall vertex lies between the floor and the ceiling', () => {
  const house = SETS[12].shell!;
  assert.ok(house.y! > 0);
  const { floor, walls, ceiling } = buildShell(house);
  const ys = (s: { pos: Float32Array }) => Array.from({ length: s.pos.length / 3 }, (_, i) => s.pos[i * 3 + 1]);
  assert.ok(ys(floor).every((y) => Math.abs(y - house.y!) < 1e-6));
  assert.ok(ys(ceiling).every((y) => Math.abs(y - house.y! - house.h) < 1e-6));
  const wy = ys(walls);
  assert.ok(Math.abs(Math.min(...wy) - house.y!) < 1e-6, `the walls start at ${Math.min(...wy)}, the floor at ${house.y}`);
  assert.ok(Math.abs(Math.max(...wy) - house.y! - house.h) < 1e-6, `the walls end at ${Math.max(...wy)}, the ceiling at ${house.y! + house.h}`);
});
