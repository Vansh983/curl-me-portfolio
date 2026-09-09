"""Lights a set in Cycles and bakes the light into a lightmap.

Input: .cache/bake/set<i>.glb and .json from scripts/stage-export.mjs (the set as the runtime built it,
mesh names `kind|prop|surface|live`). Output: .cache/bake/set<i>_baked.glb (the static meshes with a
second uv set, `Lightmap`), .cache/bake/set<i>_lm.png (sRGB, irradiance / SCALE), and a Cycles render
from the set's first dolly key for review. scripts/stage-bake.mjs wraps this and compresses the outputs.

    blender -b -P scripts/stage-bake.py -- <set> [samples=256] [size=2048] [preview=1]
"""
import bpy, json, math, os, re, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["0"]
SET = int(argv[0])
SAMPLES = int(argv[1]) if len(argv) > 1 else 256
SIZE = int(argv[2]) if len(argv) > 2 else 2048
PREVIEW = int(argv[3]) if len(argv) > 3 else 1
SCALE = 4.0  # the lightmap stores irradiance / SCALE, the runtime multiplies back
ROOT = os.getcwd()
SRC = f"{ROOT}/.cache/bake/set{SET}.glb"
MANIFEST = json.load(open(f"{ROOT}/.cache/bake/set{SET}.json"))
OUT_GLB = f"{ROOT}/.cache/bake/set{SET}_baked.glb"
OUT_LM = f"{ROOT}/.cache/bake/set{SET}_lm.png"
OUT_PREVIEW = f"{ROOT}/.cache/bake/set{SET}_render.png"

# what never enters the bake (far backdrops the runtime keeps drawing), what emits, what stays live
DROP_LIVE = {"city", "sky", "water", "flight"}
DROP_PROP = {"clouds", "bridge", "boats", "piers", "nightSky", "sky", "flightSky", "campusView", "sydneyHarbour", "harbourWater", "bennelongPoint"}
EMIT = {"paint:screenCode": 4.0, "paint:screenFloqer": 4.0, "paint:screenBoard": 4.0, "paint:screenTerminal": 4.0, "paint:screen": 3.0, "paint:video": 3.0,
        "mat:tubeGlass": 6.0, "mat:bulb": 5.0, "mat:ledStrip": 40.0, "mat:powerLed": 4.0, "mat:xboxGreen": 2.0, "mat:lampGlobe": 6.0}
LIVE_SURFACE = {"mat:tubeGlass", "mat:bulb", "mat:curtain", "mat:cabinGlass", "mat:gatewayGlass"}  # runtime keeps building these pieces
# in the scene for shadow and bounce, not baked, not exported: the wide ground, the leafy models (bake.ts CONTEXT_*)
CONTEXT_PROP = {"plazaFloor", "road"}
CONTEXT_MODEL = {"palm_medium", "island_tree_01"}


def hexrgb(h):
    h = h.lstrip("#")
    s = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in s]


def parse(name):
    base = re.sub(r"\.\d{3}$", "", name)
    parts = base.split("|")
    if len(parts) < 4:
        return None
    return {"kind": parts[0], "prop": parts[1], "surface": parts[2], "live": parts[3]}


def is_live(info):
    if info["prop"] in CONTEXT_PROP or (info["kind"] == "m" and info["prop"] in CONTEXT_MODEL):
        return True
    if info["surface"].startswith("paint:"):
        return True  # a painted face is a thin quad on a board: the runtime draws it, lit live
    if info["surface"] in LIVE_SURFACE:
        return True
    if info["live"] in ("fan", "door", "drop"):
        return True  # things the runtime moves: the fan turns, a door swings open, the projection screen comes down
    return False


# ---- scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "METAL"
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == "METAL"
scene.cycles.device = "GPU"
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = False
scene.cycles.max_bounces = 8
scene.cycles.diffuse_bounces = 6
scene.cycles.caustics_reflective = False
scene.cycles.caustics_refractive = False

bpy.ops.import_scene.gltf(filepath=SRC)

# ---- classify, drop, apply transforms, single-user
static, live, gone = [], [], []
for ob in list(bpy.data.objects):
    if ob.type != "MESH":
        if ob.type in ("LIGHT", "CAMERA"):
            bpy.data.objects.remove(ob)
        continue
    info = parse(ob.name)
    if info is None or info["live"] in DROP_LIVE or info["prop"] in DROP_PROP:
        gone.append(ob)
        continue
    ob["info"] = json.dumps(info)
    (live if is_live(info) else static).append(ob)
for ob in gone:
    bpy.data.objects.remove(ob)
# drop the empties the importer made for the groups, after their children are freed
for ob in list(bpy.data.objects):
    if ob.type == "EMPTY" and not ob.children:
        bpy.data.objects.remove(ob)

bpy.ops.object.select_all(action="DESELECT")
for ob in static + live:
    ob.select_set(True)
if static:
    bpy.context.view_layer.objects.active = static[0]
    bpy.ops.object.make_single_user(object=True, obdata=True, material=False)
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
print(f"[bake] static {len(static)} live {len(live)} dropped {len(gone)}")


def key_of(ob):
    info = json.loads(ob["info"])
    return "|".join([info["kind"], info["prop"], info["surface"], info["live"]])


def info_of_mat(mat):
    base = re.sub(r"\.\d{3}$", "", mat.name)
    parts = base.split("|")
    return {"kind": parts[0], "prop": parts[1], "surface": parts[2], "live": parts[3]} if len(parts) >= 4 else None


# every material takes the name of the piece it is on, so after the join each primitive still says
# what it was (a model keeps its own material names behind the prefix); the runtime reads these back
for ob in static + live:
    info = json.loads(ob["info"])
    for slot in ob.material_slots:
        mat = slot.material
        if mat is None:
            mat = bpy.data.materials.new("blank")
            mat.use_nodes = True
        mat = mat.copy()
        mat.name = key_of(ob) if info["kind"] != "m" else f"m|{info['prop']}|{re.sub(r'[.]\d{3}$', '', mat.name)}|{info['live']}"
        slot.material = mat
    if not ob.material_slots:
        mat = bpy.data.materials.new(key_of(ob))
        mat.use_nodes = True
        ob.data.materials.append(mat)

# the runtime builds triangle soups: weld them so a wall is one island, not two thousand
for ob in static:
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=0.0002)
    bpy.ops.object.mode_set(mode="OBJECT")

# one object: one unwrap, one pack, one bake pass (Cycles compiles its kernels per bake)
bpy.ops.object.select_all(action="DESELECT")
for ob in static:
    ob.select_set(True)
bpy.context.view_layer.objects.active = static[0]
bpy.ops.object.join()
joined = bpy.context.view_layer.objects.active
joined.name = "Static"
static = [joined]
print(f"[bake] joined: {len(joined.data.polygons)} faces, {len(joined.material_slots)} materials")

# ---- emitters: screens, tubes, bulbs glow; the rest is lit
for ob in static + live:
    for slot in ob.material_slots:
        mat = slot.material
        info = info_of_mat(mat) if mat else None
        if not info or not mat.use_nodes:
            continue
        strength = EMIT.get(info["surface"])
        if strength is None:
            for k, v in EMIT.items():
                if info["surface"].startswith(k):
                    strength = v
        if strength is None:
            continue
        nt = mat.node_tree
        bsdf = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if not bsdf:
            continue
        bsdf.inputs["Emission Strength"].default_value = strength
        color_in = bsdf.inputs["Base Color"]
        if color_in.links:
            nt.links.new(color_in.links[0].from_socket, bsdf.inputs["Emission Color"])
        else:
            bsdf.inputs["Emission Color"].default_value = color_in.default_value

# ---- lights: the world, the sun, the windows, the point lights the runtime had
world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
sky = hexrgb(MANIFEST["tint"]["sky"])
if MANIFEST["env"] == "sky":
    bg.inputs["Color"].default_value = (*sky, 1)
    bg.inputs["Strength"].default_value = 1.0
else:
    # indoors the world only shows through the openings: the hemisphere colour at the tint's power
    bg.inputs["Color"].default_value = (*sky, 1)
    bg.inputs["Strength"].default_value = max(0.05, MANIFEST["tint"]["power"] * 1.2)

sun_spec = MANIFEST["sun"]
if sun_spec["power"] > 0:
    sun_data = bpy.data.lights.new("Sun", "SUN")
    sun_data.energy = sun_spec["power"] * (4.0 if MANIFEST["env"] == "sky" else 2.5)
    sun_data.color = hexrgb(sun_spec["color"])
    sun_data.angle = math.radians(2.0)
    sun = bpy.data.objects.new("Sun", sun_data)
    scene.collection.objects.link(sun)
    # three: light travels from dir toward the target; glTF import turned y-up into z-up (y -> -z... x, -z, y)
    d = Vector((sun_spec["dir"][0], -sun_spec["dir"][2], sun_spec["dir"][1])).normalized()
    sun.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()

shell = MANIFEST.get("shell")
if shell:
    x0, x1 = shell["x"]
    z0, z1 = shell["z"]
    for op in shell["openings"]:
        if "sill" not in op:
            continue  # a door: the next room lights it
        # a window: an area light just outside, the size of the opening, the sky's colour
        w, h = op["w"], op["h"]
        cy = (op.get("sill", 0) + h / 2)
        if op["wall"] in ("z-", "z+"):
            z = (z0 - 0.05) if op["wall"] == "z-" else (z1 + 0.05)
            pos = Vector((op["at"], -z, cy))
            rot = (math.radians(-90), 0, 0) if op["wall"] == "z-" else (math.radians(90), 0, 0)  # an area light shines down its -z
        else:
            x = (x0 - 0.05) if op["wall"] == "x-" else (x1 + 0.05)
            pos = Vector((x, -op["at"], cy))
            rot = (0, math.radians(-90), 0) if op["wall"] == "x-" else (0, math.radians(90), 0)
        ld = bpy.data.lights.new("Window", "AREA")
        ld.shape = "RECTANGLE"
        ld.size, ld.size_y = w, h
        ld.color = sky
        night = MANIFEST["envPower"] < 0.1
        ld.energy = w * h * (10.0 if night else 30.0)
        lo = bpy.data.objects.new("Window", ld)
        lo.location = pos
        lo.rotation_euler = rot
        scene.collection.objects.link(lo)

for i, L in enumerate(MANIFEST["lights"]):
    ld = bpy.data.lights.new(f"Point{i}", "POINT")
    ld.color = hexrgb(L["color"])
    ld.energy = L["intensity"] * 12.0
    ld.shadow_soft_size = 0.06
    lo = bpy.data.objects.new(f"Point{i}", ld)
    lo.location = (L["at"][0], -L["at"][2], L["at"][1])
    scene.collection.objects.link(lo)

# ---- lightmap uv: one atlas across every static mesh, islands sized by their area
bpy.ops.object.select_all(action="DESELECT")
for ob in static:
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    if not ob.data.uv_layers:
        ob.data.uv_layers.new(name="UVMap")
    while len(ob.data.uv_layers) > 1:  # a model's spare uv set would push the lightmap to TEXCOORD_2
        ob.data.uv_layers.remove(ob.data.uv_layers[-1])
    uv = ob.data.uv_layers.new(name="Lightmap")
    ob.data.uv_layers.active = uv
    uv.active_render = False
bpy.context.view_layer.objects.active = static[0]
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.001, correct_aspect=True, scale_to_bounds=False)
# uv selection is its own thing: select every island, then pack them all, every object, into one square
bpy.context.scene.tool_settings.use_uv_select_sync = False
bpy.ops.uv.select_all(action="SELECT")
bpy.ops.uv.pack_islands(rotate=True, scale=True, margin_method="ADD", margin=0.002, shape_method="AABB")
bpy.ops.object.mode_set(mode="OBJECT")
# the first uv layer stays the render one (tiled maps), the second is baked into and exported as TEXCOORD_1
for ob in static:
    ob.data.uv_layers[0].active_render = True
    ob.data.uv_layers.active = ob.data.uv_layers["Lightmap"]

# ---- bake
img = bpy.data.images.new("LM", SIZE, SIZE, alpha=False, float_buffer=True)
img.colorspace_settings.name = "Non-Color"
seen = set()
for ob in static:
    for slot in ob.material_slots:
        mat = slot.material
        if not mat:
            mat = bpy.data.materials.new("Blank")
            mat.use_nodes = True
            slot.material = mat
        if not mat.use_nodes:
            mat.use_nodes = True
        if mat.name in seen:
            continue
        seen.add(mat.name)
        nt = mat.node_tree
        node = nt.nodes.new("ShaderNodeTexImage")
        node.image = img
        node.name = "LM_BAKE"
        uvn = nt.nodes.new("ShaderNodeUVMap")
        uvn.uv_map = "Lightmap"
        nt.links.new(uvn.outputs["UV"], node.inputs["Vector"])
        nt.nodes.active = node
bake = scene.render.bake
bake.use_pass_direct = True
bake.use_pass_indirect = True
bake.use_pass_color = False
bake.margin = 6
bake.use_clear = True
bake.target = "IMAGE_TEXTURES"
scene.cycles.bake_type = "DIFFUSE"
bpy.ops.object.select_all(action="DESELECT")
for ob in static:
    ob.select_set(True)
bpy.context.view_layer.objects.active = static[0]
print(f"[bake] baking {len(static)} meshes at {SIZE} px, {SAMPLES} samples")
bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, margin=6, use_clear=True, uv_layer="Lightmap")

# ---- denoise and encode: OIDN in the compositor, / SCALE, sRGB, 8 bit
comp = bpy.data.scenes.new("Comp")
comp.render.engine = "BLENDER_WORKBENCH"
comp.render.resolution_x = comp.render.resolution_y = SIZE
comp.render.resolution_percentage = 100
comp.render.image_settings.file_format = "PNG"
comp.render.image_settings.color_mode = "RGB"
comp.render.image_settings.color_depth = "8"
try:
    comp.view_settings.view_transform = "Standard"
except TypeError:
    pass
comp.view_settings.look = "None"
comp.render.filepath = OUT_LM
cam_data = bpy.data.cameras.new("CompCam")
cam = bpy.data.objects.new("CompCam", cam_data)
comp.collection.objects.link(cam)
comp.camera = cam
ng = bpy.data.node_groups.new("CompTree", "CompositorNodeTree")
ng.interface.new_socket(name="Image", in_out="OUTPUT", socket_type="NodeSocketColor")
comp.compositing_node_group = ng
nt = ng
out = nt.nodes.new("NodeGroupOutput")
src = nt.nodes.new("CompositorNodeImage")
src.image = img
dn = nt.nodes.new("CompositorNodeDenoise")
if "HDR" in dn.inputs:
    dn.inputs["HDR"].default_value = True
mul = nt.nodes.new("CompositorNodeExposure")  # 2^exposure: the map stores irradiance / SCALE
mul.inputs["Exposure"].default_value = -math.log2(SCALE)
nt.links.new(src.outputs["Image"], dn.inputs["Image"])
nt.links.new(dn.outputs["Image"], mul.inputs["Image"])
nt.links.new(mul.outputs["Image"], out.inputs[0])
bpy.context.window.scene = comp
bpy.ops.render.render(write_still=True, scene="Comp")
bpy.context.window.scene = scene
print(f"[bake] lightmap {OUT_LM}")

# ---- export the static meshes with both uv sets
bpy.ops.object.select_all(action="DESELECT")
for ob in static:
    ob.select_set(True)
    for slot in ob.material_slots:
        nt = slot.material.node_tree
        n = nt.nodes.get("LM_BAKE")
        if n:
            nt.nodes.remove(n)
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format="GLB", use_selection=True, export_apply=True, export_lights=False,
                          export_cameras=False, export_texcoords=True, export_normals=True, export_materials="EXPORT",
                          export_image_format="AUTO", export_yup=True)
print(f"[bake] glb {OUT_GLB}")

# ---- a Cycles render from the dolly for review: the ground truth the bake approximates
view = MANIFEST.get("view")
if PREVIEW and view:
    cd = bpy.data.cameras.new("Cam")
    cd.lens_unit = "FOV"
    cd.angle = math.radians(view["fov"] * 1.5)
    co = bpy.data.objects.new("Cam", cd)
    scene.collection.objects.link(co)
    p, l = view["cam"], view["look"]
    co.location = (p[0], -p[2], p[1])
    look = Vector((l[0], -l[2], l[1]))
    co.rotation_euler = (look - co.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = co
    scene.render.resolution_x, scene.render.resolution_y = 960, 600
    scene.cycles.samples = max(64, SAMPLES // 4)
    scene.cycles.use_denoising = True
    for vt in ("Khronos PBR Neutral", "Standard"):
        try:
            scene.view_settings.view_transform = vt
            break
        except TypeError:
            continue
    scene.view_settings.exposure = math.log2(MANIFEST["exposure"]) if MANIFEST["exposure"] > 0 else 0
    scene.render.filepath = OUT_PREVIEW
    bpy.ops.render.render(write_still=True)
    print(f"[bake] preview {OUT_PREVIEW}")
