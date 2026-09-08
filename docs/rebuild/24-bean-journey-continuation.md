# Requested continuation: teaching → Bean → graduation → Toronto

2026-09-08. User direction received during the 96-seat auditorium revision. **Pending implementation**, not a record of completed scenes.

## Exact requested order

1. After the airborne phone portal, sit in the highest/back row of the large auditorium.
2. Get up and walk down to the teaching stage. Turn around to reveal the whole auditorium filled with students.
3. Teach Generative AI from behind a podium, with a laptop on it. Remain first-person; other people are now explicitly requested, but no visible player avatar.
4. Exit through the door on the teacher's right, into Sydney, Australia (not Sydney, Nova Scotia).
5. Build Bean's app in a room with a central shared table, multiple computers and a messy working surface. Reuse the repository's Bean identity and existing licensed computer/desk/clutter assets.
6. Fly to Vancouver and present Bean. Make the travelling-across-Canada, fundraising-and-building story apparent; do not invent additional city visits, dates or fundraising amounts.
7. Return to Dalhousie's graduation ceremony to receive the degree.
8. Finish in Toronto, reusing the established Toronto scene and skyline rather than replacing the opening hero.

## Existing seams and implementation considerations

- Expand the teaching-stage depth so a first-person podium camera can actually encompass the whole class. Facing the audience toward +z, the teacher's right is the west/x− side: the current front x− doorway is the relevant exit.
- Existing `flight.ts`, `dolly.ts`, `sets.ts`, `built.ts`, paint registry, model manifest and Blender bake scripts remain owners. Avoid overlay-only substitute rooms.
- Current `CLASSROOM_VIEW` is held through q=1 and tests enforce this. Replace that terminal hold deliberately with a seated pause, standing movement, physical aisle descent and podium turn; preserve the original phone's fixed capture pose separately.
- `stage-run.ts` currently captures `dolly(.83)` for the phone. Before extending/rescaling the timeline, replace this magic timestamp with an explicit destination frame so later walking cannot leak into the handset.
- Stage progress depends on `SETS.length`; earlier key positions, phone/flight timing and door timing must be rescaled together or represented in shared chapter units. Preserve the actual scroll positions of the existing rooms. Reduced-motion snapping also needs destination beats rather than assuming all beats equal the number of distinct sets.
- Revisit neighbour visibility: the renderer assumes a simple set ring, whereas the requested story returns to the auditorium and Toronto. Do not duplicate all Toronto geometry merely to satisfy an index.
- Current source timeline already supplies Bean's identity (`https://beantheapp.com`), co-founder, Product Hunt/Invest NS/Web Summit story. A direct website request failed; do not silently replace this with unrelated Beanstalk branding.
- Deterministic scrolling must work backwards, through doorway/flight transitions and into the graduation/return beats.

## Model research / access

The user has been asked asynchronously whether to select licensed people models or use a supplied pack. No reply yet at the time of writing. No paid purchase or external account change has been made.

- [BlenderKit seated Katka scan](https://www.blenderkit.com/asset-gallery-detail/1a86cdd7-5431-40ca-ac7f-17ea1fb64cf1/), seated Petra (`cd3c5bbe-dbdd-4033-98ca-44e7ebf999f5`) and seated Eliska (`66256c9b-5740-462b-a967-8bb5e6d59bdd`) are realistic candidates. Public API marks them royalty-free but not free. Blend download IDs: 3816, 3819 and 3814. A read-only unauthenticated check of download 3816 returned HTTP 401. A licensed account/archive is needed to use these particular models. Do not print or store account credentials in committed files.
- BlenderKit has free low-poly seated male/female models, but these are not a verified match for the user's realism requirement. Do not silently fill the new class with primitive or cartoon placeholders.
- [Renderpeople free models](https://renderpeople.com/free-3d-people/) include scans and rigged people, but [their terms](https://renderpeople.com/general-terms-and-conditions/), section 4.3(b), restrict making individual model files easily downloadable. Do not place their standalone models into this public GLB asset directory without resolving that distribution constraint.
- [Dalhousie's convocation information](https://www.dal.ca/study/graduation-and-convocation/convocation.html) identifies the Rebecca Cohn Auditorium for most current ceremonies. This is venue research, not proof of the user's historical ceremony venue/date. Do not claim an exact historical reconstruction without confirmation.

No student crowd, teaching walk, Sydney workspace, Vancouver presentation, graduation or Toronto return has been added yet. The completed local deliverable remains the auditorium in [23-lecture-auditorium.md](./23-lecture-auditorium.md).
