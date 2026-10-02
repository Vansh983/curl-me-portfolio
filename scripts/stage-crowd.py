"""Renders the people of the hall's crowd as small frames, one loop of movement each.

Input: .cache/crowd/plan.json from scripts/stage-crowd.mjs (which person, dressed how, doing what, at what size)
and the originals it fetched into .cache/rocketbox/: Microsoft Rocketbox avatars (FBX and their colour textures)
and Rocketbox animation clips (MIT, https://github.com/microsoft/Microsoft-Rocketbox).
Output: .cache/crowd/frames/<atlas>/<k>_<i>.png (straight alpha, plain sRGB) and .cache/crowd/meta.json
(each person's height, the frames of the clip that were used). scripts/stage-crowd.mjs packs them.

    blender -b -P scripts/stage-crowd.py [-- <n> ...]      only those sequences (their place in the plan), for a look
    blender -b -P scripts/stage-crowd.py -- strip <id> <clip> [step=6] [gown]
                                                           a whole clip on one person, every step-th frame, into
                                                           .cache/crowd/strips/, to choose clips by eye

The person faces the camera (the stage). Orthographic, from 10 degrees above for the near rows and 4 for the far.
A cell is 1.2 m wide and 2.4 m tall on a standing card: the ground under the pelvis lies 3 percent up the cell,
the pelvis on its centre line. Light: a warm key from the stage side and above, a cool rim from above and behind.

The gown is made here, not downloaded: a black robe hung from the shoulders to mid calf, wide sleeves, and the
hood's lining turned out over the shoulders in the degree's colours. Dalhousie's Bachelor of Computer Science is
emerald green with a gold border (dal.ca/convocation/history_traditions/gowns_hoods.html). No cap: at Dalhousie
only Master and PhD graduands wear one.
"""
import bpy, bmesh, json, math, os, sys
from mathutils import Vector

ROOT = os.getcwd()
SRC = os.path.join(ROOT, ".cache/rocketbox")
OUT = os.path.join(ROOT, ".cache/crowd")
PLAN = json.load(open(os.path.join(OUT, "plan.json")))
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
STRIP = ARGS[1:] if ARGS[:1] == ["strip"] else None
ONLY = [int(a) for a in ARGS] if ARGS and STRIP is None else None
CELL_W, CELL_H = PLAN["metres"]
FEET = PLAN["feet"]
TORSO = ["Bip01 Pelvis", "Bip01 Spine", "Bip01 Spine1", "Bip01 Spine2"]
UNDER_GOWN = set(TORSO + [f"Bip01 {s} {b}" for s in "LR" for b in ("Clavicle", "UpperArm", "Thigh")])
ARM = ("Clavicle", "UpperArm", "Forearm", "Hand", "Finger")
HOOD_LINING, HOOD_BORDER = (0.0, 0.115, 0.052), (0.36, 0.215, 0.018)  # emerald green, gold (linear)

sc = None
cam = None


def scene():
    """An empty scene with the hall's light on one standing person, and the camera."""
    global sc, cam
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        sc.cycles.device = "GPU"
    except Exception:
        sc.cycles.device = "CPU"
    sc.cycles.samples = PLAN["samples"]
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 3
    sc.render.film_transparent = True
    sc.render.use_persistent_data = True  # the textures stay loaded from one frame to the next
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.render.image_settings.color_depth = "8"
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    sc.view_settings.exposure = 0
    sc.view_settings.gamma = 1
    world = bpy.data.worlds.new("hall")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.55, 0.6, 0.8, 1)
    bg.inputs[1].default_value = PLAN["light"]["fill"]
    sc.world = world

    def area(name, energy, size, colour, at, to=(0, 0, 1.2)):
        light = bpy.data.objects.new(name, bpy.data.lights.new(name, "AREA"))
        sc.collection.objects.link(light)
        light.data.energy, light.data.size, light.data.color = energy, size, colour
        light.location = at
        light.rotation_euler = (Vector(to) - Vector(at)).to_track_quat("-Z", "Y").to_euler()
        return light

    L = PLAN["light"]
    area("key", L["key"], 5.0, (1.0, 0.8, 0.6), (0, -6.5, 4.6))  # the stage wash spilling into the house
    area("rim", L["rim"], 2.5, (0.62, 0.76, 1.0), (0, 3.2, 4.8), (0, 0, 1.5))  # the house's cans, above and behind
    cam = bpy.data.objects.new("eye", bpy.data.cameras.new("eye"))
    sc.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    cam.data.clip_start, cam.data.clip_end = 0.1, 60
    sc.camera = cam


def aim(atlas, centre, ground):
    """The camera for one atlas: the ground under the pelvis on the feet line, the pelvis on the centre line."""
    w, h = PLAN["atlases"][atlas]["cell"]
    e = math.radians(PLAN["atlases"][atlas]["elevation"])
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = w, h, 100
    sc.render.pixel_aspect_x, sc.render.pixel_aspect_y = 1 / math.cos(e), 1  # a standing card: heights shrink by cos, widths do not
    frame_h = CELL_H * math.cos(e)
    cam.data.ortho_scale = frame_h
    forward, up = Vector((0, math.cos(e), -math.sin(e))), Vector((0, math.sin(e), math.cos(e)))
    cam.location = Vector((centre.x, centre.y, ground)) + up * frame_h * (0.5 - FEET) - forward * 20
    cam.rotation_euler = forward.to_track_quat("-Z", "Y").to_euler()
    return e


def principled(name, colour=(0.8, 0.8, 0.8), rough=0.75, image=None, alpha=False):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*colour, 1)
    b.inputs["Roughness"].default_value = rough
    if image:
        t = m.node_tree.nodes.new("ShaderNodeTexImage")
        t.image = image
        m.node_tree.links.new(t.outputs["Color"], b.inputs["Base Color"])
        if alpha:
            m.node_tree.links.new(t.outputs["Alpha"], b.inputs["Alpha"])
    return m


class Person:
    """One Rocketbox avatar in the scene: its rig, its mesh with the textures put back on, a gown it can put on."""

    def __init__(self, pid):
        self.id, self.info = pid, PLAN["avatars"][pid]
        before = set(bpy.data.objects.keys())
        bpy.ops.import_scene.fbx(filepath=os.path.join(SRC, pid + ".fbx"))
        new = [bpy.data.objects[n] for n in bpy.data.objects.keys() if n not in before]
        self.objects = new
        self.arm = next(o for o in new if o.type == "ARMATURE")
        self.mesh = max((o for o in new if o.type == "MESH"), key=lambda o: len(o.data.vertices))
        bpy.context.view_layer.update()
        self.materials()
        W = self.mesh.matrix_world
        self.rest = [W @ v.co for v in self.mesh.data.vertices]
        self.height = max(p.z for p in self.rest)
        names = {g.index: g.name for g in self.mesh.vertex_groups}
        self.lead = [names[max(v.groups, key=lambda g: g.weight).group] if v.groups else "" for v in self.mesh.data.vertices]
        A = self.arm.matrix_world
        self.joint = {b.name: A @ b.head_local for b in self.arm.data.bones}
        self.gown = None
        self.phone = []

    def materials(self):
        tex = self.info["tex"]
        for slot in self.mesh.material_slots:
            name = slot.material.name.lower()
            kind = "glasses" if "glasses" in name else "opacity" if "opacity" in name else "head" if "head" in name else "body"
            file = f"{tex}_glasses_opacity_color.tga" if kind == "glasses" else f"{tex}_{kind}_color.tga"
            path = os.path.join(SRC, file)
            if not os.path.exists(path):
                slot.material = principled(f"{self.id}_{kind}", (0.05, 0.04, 0.035))
                continue
            img = bpy.data.images.load(path)
            slot.material = principled(f"{self.id}_{kind}", rough=0.6 if kind == "head" else 0.8, image=img, alpha=kind in ("opacity", "glasses"))
        self.body_slots = [i for i, s in enumerate(self.mesh.material_slots) if s.material.name.endswith("_body")]

    # the gown ---------------------------------------------------------------------------------------------------
    def torso_slice(self, z, dz=0.035):
        """How wide and deep the body is at a height, arms left out: half width, front y, back y."""
        pts = [p for p, lead in zip(self.rest, self.lead) if abs(p.z - z) < dz and not any(a in lead for a in ARM) and "Head" not in lead]
        if not pts:
            return None
        return max(abs(p.x) for p in pts), min(p.y for p in pts), max(p.y for p in pts)

    def make_gown(self):
        J, s = self.joint, self.height / 1.8
        verts, faces, mats, weights = [], [], [], []  # weights: per vertex {bone: w}
        N = 64

        def ring(cx, cy, z, rx, ry, w, fold=0):
            """An ellipse of the gown at one height; `fold` pleats it, so the cloth hangs in folds and not as a bell."""
            i0 = len(verts)
            for k in range(N):
                t = 2 * math.pi * k / N
                f = 1 + fold * math.sin(9 * t + 1.3)
                verts.append((cx + rx * f * math.cos(t), cy + ry * f * math.sin(t), z))
                weights.append(w)
            return i0

        def band(a, b, n, mat):
            for k in range(n):
                faces.append((a + k, a + (k + 1) % n, b + (k + 1) % n, b + k))
                mats.append(mat(k) if callable(mat) else mat)

        def spine_weight(z):
            zs = [J[b].z for b in TORSO]
            if z <= zs[0]:
                return {TORSO[0]: 1}
            if z >= zs[-1]:
                return {TORSO[-1]: 1}
            for i in range(len(zs) - 1):
                if zs[i] <= z < zs[i + 1]:
                    t = (z - zs[i]) / (zs[i + 1] - zs[i])
                    return {TORSO[i]: 1 - t, TORSO[i + 1]: t}

        # the yoke: from the collar out over the shoulders, the hood's lining and its border lying on it
        neck, sh = J["Bip01 Neck"], J["Bip01 L UpperArm"]
        zc, zs_ = neck.z + 0.03 * s, sh.z + 0.012 * s
        chest = self.torso_slice(zs_ - 0.06) or (0.2, -0.12, 0.1)
        cyc, rxc, ryc = neck.y - 0.012, 0.068 * s, 0.078 * s
        cys, rxs, rys = (chest[1] + chest[2]) / 2, abs(sh.x) + 0.03 * s, (chest[2] - chest[1]) / 2 + 0.03
        YOKE = 5
        rings = []
        for j in range(YOKE + 1):
            u = j / YOKE
            rings.append(ring(cyc * 0 + 0, cyc + (cys - cyc) * u, zc - (zc - zs_) * u ** 1.25, rxc + (rxs - rxc) * u, ryc + (rys - ryc) * u ** 0.8, {"Bip01 Spine2": 1}))
        for j in range(YOKE):
            def mat(k, j=j):
                over_shoulder = abs(math.cos(2 * math.pi * (k + 0.5) / N)) > 0.5
                return (1 if j < 3 else 2 if j == 3 else 0) if over_shoulder else 0
            band(rings[j], rings[j + 1], N, mat)
        # the body: hung from the shoulders, never narrower going down, to mid calf
        knee, ankle = J["Bip01 L Calf"].z, J["Bip01 L Foot"].z
        hem = knee - 0.45 * (knee - ankle)
        zs = [J["Bip01 Spine2"].z, J["Bip01 Spine1"].z, J["Bip01 Spine"].z, J["Bip01 Pelvis"].z, J["Bip01 Pelvis"].z - 0.13 * s]
        while zs[-1] - 0.16 > hem:
            zs.append(zs[-1] - 0.16)
        zs.append(hem)
        prev, rx, ry, cy, zp = rings[-1], rxs, rys, cys, zs_
        for z in zs:
            sl = self.torso_slice(z)
            drop = zp - z
            rx, ry = rx + 0.03 * drop, ry + 0.035 * drop
            if sl:
                rx, ry = max(rx, sl[0] + 0.03), max(ry, (sl[2] - sl[1]) / 2 + 0.035)
                cy = cy + ((sl[1] + sl[2]) / 2 - cy) * 0.5
            r = ring(0, cy, z, rx, ry, spine_weight(z), 0.07 * ((zs_ - z) / (zs_ - hem)) ** 1.2)
            band(prev, r, N, 0)
            prev, zp = r, z
        # the sleeves: tubes along the arms, widening to the cuff just short of the wrist
        M = 14
        for side in "LR":
            S, E, Wr = J[f"Bip01 {side} UpperArm"], J[f"Bip01 {side} Forearm"], J[f"Bip01 {side} Hand"]
            up, fore = f"Bip01 {side} UpperArm", f"Bip01 {side} Forearm"
            stops = [(S + (S - E) * 0.02 + Vector((-0.03 if side == "L" else 0.03, 0, -0.02)), E - S, 0.058, {up: 0.5, "Bip01 Spine2": 0.5}), (S.lerp(E, 0.18), E - S, 0.068, {up: 1}), (S.lerp(E, 0.55), E - S, 0.075, {up: 1}),
                     (S.lerp(E, 0.85), E - S, 0.079, {up: 0.85, fore: 0.15}), (E, (E - S).normalized() + (Wr - E).normalized(), 0.083, {up: 0.5, fore: 0.5}),
                     (E.lerp(Wr, 0.2), Wr - E, 0.088, {up: 0.12, fore: 0.88}), (E.lerp(Wr, 0.45), Wr - E, 0.097, {fore: 1}), (E.lerp(Wr, 0.7), Wr - E, 0.108, {fore: 1}), (E.lerp(Wr, 0.92), Wr - E, 0.12, {fore: 1})]
            prev = None
            for c, axis, r, w in stops:
                axis = axis.normalized()
                u = axis.cross(Vector((0, 1, 0))).normalized()
                v = axis.cross(u)
                i0 = len(verts)
                for k in range(M):
                    t = 2 * math.pi * k / M
                    verts.append(tuple(c + (u * math.cos(t) + v * math.sin(t)) * r * s))
                    weights.append(w)
                if prev is not None:
                    band(prev, i0, M, 0)
                prev = i0
        me = bpy.data.meshes.new(self.id + "_gown")
        me.from_pydata(verts, [], faces)
        black = principled("gown", (0.007, 0.007, 0.008), 0.85)
        black.node_tree.nodes["Principled BSDF"].inputs["Specular IOR Level"].default_value = 0.12  # cloth, not plastic: black stays black under the key
        me.materials.append(black)
        me.materials.append(principled("hoodLining", HOOD_LINING, 0.38))
        me.materials.append(principled("hoodBorder", HOOD_BORDER, 0.38))
        for p, m in zip(me.polygons, mats):
            p.material_index = m
            p.use_smooth = True
        ob = bpy.data.objects.new(self.id + "_gown", me)
        sc.collection.objects.link(ob)
        for vi, w in enumerate(weights):
            for bone, x in w.items():
                (ob.vertex_groups.get(bone) or ob.vertex_groups.new(name=bone)).add([vi], x, "REPLACE")
        ob.parent = self.arm
        ob.matrix_parent_inverse = self.arm.matrix_world.inverted()
        mod = ob.modifiers.new("rig", "ARMATURE")
        mod.object = self.arm
        self.gown = ob
        # what the gown covers is taken out of the body, so nothing of the clothes underneath pokes through it
        hide = self.mesh.vertex_groups.new(name="underGown")
        body_verts = set()
        for p in self.mesh.data.polygons:
            if p.material_index in self.body_slots:
                body_verts.update(p.vertices)
        legs = ("Thigh", "Calf")  # a knee that comes forward would show through the cloth: the legs go as far down as the hem
        hide.add([i for i in body_verts if self.rest[i].z > hem + 0.01 and (self.lead[i] in UNDER_GOWN or any(b in self.lead[i] for b in legs))], 1, "REPLACE")
        mask = self.mesh.modifiers.new("underGown", "MASK")
        mask.vertex_group, mask.invert_vertex_group = "underGown", True

    def wear(self, kind):
        if kind == "gown" and not self.gown:
            self.make_gown()
        if self.gown:
            self.gown.hide_render = kind != "gown"
            self.mesh.modifiers["underGown"].show_render = kind == "gown"
            self.mesh.modifiers["underGown"].show_viewport = kind == "gown"

    # the clip -----------------------------------------------------------------------------------------------------
    def follow(self, clip):
        """Takes the clip's pose bone by bone, in the world. A clip's own rig rests in its standing pose and an avatar's
        in its arms-out pose, so the clip's action put straight on the avatar leaves the arms 45 degrees out."""
        src = load_clip(clip)
        for pb in self.arm.pose.bones:
            if pb.name not in src.pose.bones:
                continue
            c = pb.constraints.get("follow") or pb.constraints.new("COPY_ROTATION")
            c.name, c.target, c.subtarget, c.target_space, c.owner_space = "follow", src, pb.name, "WORLD", "WORLD"
        pel = self.arm.pose.bones["Bip01 Pelvis"]
        c = pel.constraints.get("followAt") or pel.constraints.new("COPY_LOCATION")
        c.name, c.target, c.subtarget, c.target_space, c.owner_space = "followAt", src, "Bip01 Pelvis", "WORLD", "WORLD"
        return src

    def at(self, t):
        sc.frame_set(int(math.floor(t)), subframe=t - math.floor(t))
        return self.arm.matrix_world @ self.arm.pose.bones["Bip01 Pelvis"].head

    def loops(self, clip, action):
        """Stretches of the clip to play round and round, best first. A clap or a stand: one cycle that closes on itself,
        where the pose and its speed come back to where they were. A cheer or a wave: one swing of the raised hand from
        one end to the other, played there and back, which closes exactly (a wave in these clips never repeats itself)."""
        if (clip, action) in LOOPS:
            return LOOPS[clip, action]
        src = load_clip(clip)
        n = int(src.animation_data.action.frame_range[1])
        P = [None]
        for f in range(1, n + 1):
            sc.frame_set(f)
            A, pb = src.matrix_world, src.pose.bones
            P.append({k: A @ pb[k].head for k in ("Bip01 Pelvis", "Bip01 Spine2", "Bip01 Head", "Bip01 L Forearm", "Bip01 R Forearm", "Bip01 L Hand", "Bip01 R Hand", "Bip01 L Finger22", "Bip01 R Finger22")})
        H, keys = P[1]["Bip01 Head"].z + 0.2, list(P[1].keys())

        def vec(t):  # the pose at a moment between frames
            f = max(1, min(n - 1, int(math.floor(t))))
            u = min(1, max(0, t - f))
            return [c for k in keys for c in P[f][k].lerp(P[f + 1][k], u)]

        dist = lambda a, b: math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))
        vel = lambda t: [x - y for x, y in zip(vec(t + 1), vec(t - 1))]
        closure = lambda a, L: dist(vec(a), vec(a + L)) + 2 * dist(vel(a), vel(a + L))
        hands = lambda f: (P[f]["Bip01 L Hand"] - P[f]["Bip01 R Hand"]).length
        top = lambda f: max(P[f]["Bip01 L Finger22"].z, P[f]["Bip01 R Finger22"].z)
        speed = lambda f: (P[min(n, f + 1)]["Bip01 L Hand"] - P[max(1, f - 1)]["Bip01 L Hand"]).length + (P[min(n, f + 1)]["Bip01 R Hand"] - P[max(1, f - 1)]["Bip01 R Hand"]).length
        lengths = {"clap": range(5, 12), "cheer": range(4, 15), "idle": range(50, 111), "phone": range(50, 111)}[action]
        found = []
        for L in lengths:
            for a in range(3, n - L - 2):
                fr = range(a, a + L + 1)
                px = sum(P[f]["Bip01 Pelvis"].x for f in fr) / len(fr)
                wide = max(abs(P[f][k].x - px) for f in fr for k in keys)
                if wide > CELL_W / 2 - 0.06 or max(top(f) for f in fr) > CELL_H * (1 - FEET) - 0.1:
                    continue
                if action == "cheer":
                    if min(top(f) - P[f]["Bip01 Head"].z for f in fr) < 0.08:  # a hand above the chin all through
                        continue
                    swing = sum((P[a][k] - P[a + L][k]).length for k in ("Bip01 L Hand", "Bip01 R Hand"))
                    path = sum((P[f][k] - P[f + 1][k]).length for f in range(a, a + L) for k in ("Bip01 L Hand", "Bip01 R Hand"))
                    if swing < 0.12 or path > 1.6 * swing:  # one clear swing, with no turn inside it
                        continue
                    found.append(((speed(a) + speed(a + L) + 0.02) / swing, a, L))  # at rest at both ends, and far apart
                    continue
                spread = max(hands(f) for f in fr) - min(hands(f) for f in fr)
                if action == "clap" and (spread < 0.04 or min(hands(f) for f in fr) > 0.5 or min(top(f) for f in fr) < 0.6 * H):  # the hands meet and part, at the chest
                    continue
                found.append((closure(a, L) / (spread * 10 if action == "clap" else 1), a, L))  # of two cycles that close as well, the livelier clap
        if not found:
            raise RuntimeError(f"no {action} loop in {clip} that stays inside the cell")
        found.sort()
        picked = []
        for c, a, L in found:
            if all(abs(a - b) >= max(L, M) for _, b, M in picked):
                if action != "cheer":  # a cycle is rarely a whole number of frames long: fit its start and length between frames
                    c, a, L = min((closure(a + da, L + dl), a + da, L + dl) for da in (-0.5, 0, 0.5) for dl in (-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75))
                picked.append((c, a, L))
            if len(picked) >= 8:
                break
        LOOPS[clip, action] = picked
        print(f"LOOPS {clip} {action}: {len(found)} found, best " + ", ".join(f"{a}+{L} ({c:.3f})" for c, a, L in picked[:5]))
        return picked

    # the phone ----------------------------------------------------------------------------------------------------
    def hold_phone(self, on):
        """The right arm up with a phone above the head, filming the stage: each arm bone turned to point down its own
        line from the shoulder to a wrist held where the phone is, the elbow out and low."""
        for o in self.phone:
            bpy.data.objects.remove(o)
        self.phone = []
        pb = self.arm.pose.bones
        chain = ["Bip01 R UpperArm", "Bip01 R Forearm", "Bip01 R Hand"]
        for b in chain:
            for c in [c for c in pb[b].constraints if c.type == "DAMPED_TRACK"]:
                pb[b].constraints.remove(c)
        if not on:
            return
        J, H = self.joint, self.height
        S, l1, l2 = J[chain[0]], (J[chain[1]] - J[chain[0]]).length, (J[chain[2]] - J[chain[1]]).length
        T = Vector((-0.2, J["Bip01 Head"].y - 0.26, H - 0.02))  # the wrist: a little to his right, ahead of the face, at the crown
        d = min((T - S).length, (l1 + l2) * 0.985)
        n = (T - S).normalized()
        T = S + n * d
        a = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
        pole = Vector((-0.75, -0.1, -0.65))
        m = (pole - n * pole.dot(n)).normalized()
        E = S + n * a + m * math.sqrt(max(0, l1 * l1 - a * a))
        tip = T + Vector((0.03, -0.02, 0.2))

        def empty(name, at):
            e = bpy.data.objects.new(name, None)
            sc.collection.objects.link(e)
            e.location = at
            self.phone.append(e)
            return e

        def along(bone, child):
            """Which of the bone's own axes runs down the limb (Rocketbox bones keep 3ds Max's axes: x, not y)."""
            b = self.arm.data.bones[bone]
            want = (self.arm.data.bones[child].head_local - b.head_local).normalized()
            R = b.matrix_local.to_3x3()
            best = max(((R.col[i].normalized().dot(want) * sgn, i, sgn) for i in range(3) for sgn in (1, -1)))
            return ("TRACK_" if best[2] > 0 else "TRACK_NEGATIVE_") + "XYZ"[best[1]]

        for bone, child, target in ((chain[0], chain[1], E), (chain[1], chain[2], T), (chain[2], "Bip01 R Finger2", tip)):
            c = pb[bone].constraints.new("DAMPED_TRACK")
            c.target, c.track_axis = empty(bone + "_to", target), along(bone, child)
        me = bpy.data.meshes.new("phone")
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1)
        bm.to_mesh(me)
        bm.free()
        me.materials.append(principled("phoneBack", (0.012, 0.012, 0.014), 0.5))
        glow = principled("phoneScreen", (0.02, 0.02, 0.02), 0.3)
        b = glow.node_tree.nodes["Principled BSDF"]
        b.inputs["Emission Color"].default_value = (0.75, 0.85, 1.0, 1)
        b.inputs["Emission Strength"].default_value = 6
        me.materials.append(glow)
        for p in me.polygons:
            p.material_index = 1 if p.normal.y > 0.9 else 0  # the screen faces him, and lights his face a little
        ph = bpy.data.objects.new("phone", me)
        sc.collection.objects.link(ph)
        ph.scale = (0.074, 0.009, 0.152)
        ph.location = T + Vector((0.02, -0.035, 0.13))
        ph.rotation_euler = (math.radians(-8), 0, math.radians(6))
        self.phone.append(ph)

    def gone(self):
        self.hold_phone(False)
        for o in self.objects + ([self.gown] if self.gown else []):
            bpy.data.objects.remove(o)
        for block in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.armatures):
            for b in list(block):
                if b.users == 0:
                    block.remove(b)


CLIPS, LOOPS = {}, {}


def load_clip(name):
    """A Rocketbox clip: its own rig, moving. The bones are named alike in every Rocketbox file."""
    if name not in CLIPS:
        before = set(bpy.data.objects.keys())
        bpy.ops.import_scene.fbx(filepath=os.path.join(SRC, name + ".fbx"))
        new = [bpy.data.objects[n] for n in bpy.data.objects.keys() if n not in before]
        CLIPS[name] = next(o for o in new if o.type == "ARMATURE")
        for o in new:
            if o is not CLIPS[name]:
                bpy.data.objects.remove(o)
    return CLIPS[name]


def extent(objs, centre, ground, e):
    """Where the person's outline falls in the cell at this frame: left, right (metres from the centre line), top
    (fraction of the cell, for feet on `ground`), and the lowest point of the person (metres)."""
    dg = bpy.context.evaluated_depsgraph_get()
    lo, hi, top, low = 9, -9, 0, 9
    for ob in objs:
        ev = ob.evaluated_get(dg)
        me = ev.to_mesh()
        W = ev.matrix_world
        for v in me.vertices:
            p = W @ v.co
            lo, hi, low = min(lo, p.x - centre.x), max(hi, p.x - centre.x), min(low, p.z)
            top = max(top, FEET + ((p.z - ground) * math.cos(e) + (p.y - centre.y) * math.sin(e)) / (CELL_H * math.cos(e)))
        ev.to_mesh_clear()
    return lo, hi, top, low


def strip(pid, clip, step=6, kind="family"):
    """Every step-th frame of a whole clip on one person, small: to see what a clip is before choosing it."""
    person = Person(pid)
    person.wear(kind)
    src = person.follow(clip)
    n = int(src.animation_data.action.frame_range[1])
    for f in range(1, n + 1, int(step)):
        centre = person.at(f)
        aim("far", Vector((centre.x, centre.y, 0)), 0)
        sc.render.filepath = os.path.join(OUT, "strips", f"{clip}_{f:04d}.png")
        bpy.ops.render.render(write_still=True)


def main():
    scene()
    if STRIP is not None:
        return strip(*STRIP)
    meta = {}
    path = os.path.join(OUT, "meta.json")
    if ONLY is not None and os.path.exists(path):
        meta = json.load(open(path))
    todo = [q for q in PLAN["sequences"] if ONLY is None or q["n"] in ONLY]
    for pid in dict.fromkeys(q["id"] for q in todo):
        person = Person(pid)
        for q in [q for q in todo if q["id"] == pid]:
            person.wear(q["kind"])
            person.hold_phone(False)
            person.follow(q["clip"])
            person.hold_phone(q["action"] == "phone")
            N, e = q["frames"], math.radians(PLAN["atlases"][q["atlas"]]["elevation"])
            shown = [person.mesh] + ([person.gown] if q["kind"] == "gown" else []) + [o for o in person.phone if o.type == "MESH"]
            # the take-th cycle of the clip in which this person, as dressed, stays inside the cell
            fits, tried = [], None
            for cost, a, L in person.loops(q["clip"], q["action"]):
                if q["action"] == "cheer":  # there and back
                    times = [a + L * (i if i <= N // 2 else N - i) / (N // 2) for i in range(N)]
                else:
                    times = [a + L * i / N for i in range(N)]
                pel = [person.at(t) for t in times]
                centre = Vector((sum(p.x for p in pel) / N, sum(p.y for p in pel) / N, 0))
                boxes = []
                for t in times:
                    person.at(t)
                    boxes.append(extent(shown, centre, 0, e))
                ground = min(b[3] for b in boxes)
                box = [min(b[0] for b in boxes), max(b[1] for b in boxes), max(b[2] for b in boxes) - ground / CELL_H]
                inside = box[0] > -CELL_W / 2 + 0.01 and box[1] < CELL_W / 2 - 0.01 and box[2] < 0.99
                tried = (cost, a, L, times, centre, ground, box, inside)
                if inside:
                    fits.append(tried)
                if len(fits) > q.get("take", 0):
                    break
            cost, a, L, times, centre, ground, box, inside = fits[min(q.get("take", 0), len(fits) - 1)] if fits else tried
            aim(q["atlas"], centre, ground)
            for i, t in enumerate(times):
                person.at(t)
                sc.render.filepath = os.path.join(OUT, "frames", q["atlas"], f"{q['k']}_{i}.png")
                bpy.ops.render.render(write_still=True)
            meta[f"{q['atlas']}:{q['k']}"] = {"id": pid, "height": round(person.height, 3), "clip": q["clip"], "from": a, "length": L, "closure": round(cost, 4), "box": [round(b, 3) for b in box], "inside": inside}
            print(f"CROWD {q['atlas']} {q['k']} {pid} {q['kind']} {q['action']} {q['clip']} frames {a}+{L} closure {cost:.3f} box {box[0]:.2f}..{box[1]:.2f} top {box[2]:.2f} {'ok' if inside else 'OUTSIDE THE CELL'}")
        person.gone()
    json.dump(meta, open(path, "w"), indent=1)


main()
