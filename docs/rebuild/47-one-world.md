# 47. One world: every set in one place, the story a circle (2026-10-07)

His words, after walking it: "there are a couple things like it does not seem like a full circle walking, i'm entering from the same room i left, stuff like that. it needs to be all like one 3d world".

## What was wrong

- Two sets stood in two places. The 2020 room stood behind Google's door until the scroll was inside it, then jumped back to where it was built, with the jet bridge; the apartment stood at the start, then moved behind Floqer's stair door for the end. The scroll never showed the move. A walker did: through the 2020 room's doors the world outside changed, and the end came in by the front door he had left through at the start.

## What stands where now (`src/lib/stage/world.ts`)

- The apartment, the 2010 room, the lab and Google's lawn: where they were written.
- The 2020 room: behind Google's door, for good. The jet bridge and the aircraft hang off its west door there, turned with it.
- The hall of 2022 to Floqer's house: one rigid chain, turned a quarter and set so that the door at the top of Floqer's stair is the far end of the 1.8 m passage east of the apartment's brick door. The flight and the hall are joined by the phone, not a door, so the chain was free to go anywhere.
- The circle: his room, out by the front door, 2010, the lab, the lawn, 2020, the flight; the phone; the hall, Sydney, the walk, Volta, the stage, Floqer's house, up the stair, through his own front door, along the passage, in through the brick, his room.

## How

- Each set's group gets a fixed turn and shift (`POSES`); the scroll's keys, written set by set, are placed through the same poses in `makeDolly`. Nothing moves at run time.
- The sun and the sky turn with a set (`turnDir`); a room's baked environment map turns with it (`environmentRotation`); the bin's mouth, the flight's sun target and the phone's capture camera are placed through the poses.
- Sets that are never drawn together may overlap in space: only neighbours through a door are drawn (and set 8 with Volta). Checked: the apartment with the 2010 room and Floqer; Floqer with the hall; the 2020 room with the lawn and the aircraft.
- The lawn and the aircraft both stand outside the 2020 room and would stand in each other's way, so each is drawn only while its own door is open, and the two doors are never open together: Google's door shuts behind him before the west door opens (the scroll), and in the Walk opening one shuts the other.
- The hall of 2022's back door, behind the top row, is shut: the phone brought him in, nothing stood beyond it.
- The apartment: the brick door is a cased hole onto the passage, whose far end is a wall round Floqer's door (`passageDoor`); the shoe rack moved to the west of the front door; set 0 rebaked (`node scripts/stage-bake.mjs 0 256 2048`).
- The ending's last keys are written in the world's frame: in the passage, the door in the brick, home: the bed, the glass, the desk.
- The Walk: no relocation code; the story's end and beginning are one room, and whichever leg runs nearer is his.

## Checked

- Scroll frames: the start, the 2020 room and both its doors, the bridge, the flight's window, the hall, the brick passage and the room at the end.
- The Walk: from the start through the brick door into Floqer's stair (the circle closes); the 2020 room's doors as a pair; the bot both ways over the whole story.
- Headless Chrome only.
