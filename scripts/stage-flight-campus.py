"""Dimensional Goldberg interpretation, not a surveyed replica. Metres, front faces +X.
Blender builds recessed glazing, panel joints, roof equipment and street-scale context.
Reference: dal.ca/campus-maps/building-directory/studley-campus/goldberg-computer-science.html
"""
import bpy
import math
import random
from pathlib import Path

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
random.seed(42)

def material(name, color, roughness=.6, metal=0):
    m = bpy.data.materials.new(name); m.diffuse_color = (*color, 1); m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = roughness
    p.inputs['Metallic'].default_value = metal
    return m

panel = [material(f'Zinc {i}', (.39+i*.015,.43+i*.015,.46+i*.015),.46,.45) for i in range(5)]
glass = [material(f'Blue glazing {i}', (.055+i*.013,.16+i*.018,.23+i*.021),.16,.7) for i in range(5)]
stone = material('Concrete', (.44,.44,.40),.86)
dark = material('Recesses and frames', (.035,.047,.058),.46,.5)
roof = material('Roof membrane', (.18,.195,.20),.93)
road = material('Asphalt', (.105,.12,.13),.96)
grass = material('Lawn', (.17,.23,.115),1)
line = material('Road paint', (.69,.70,.63),.95)
brick = material('Neighbour masonry', (.34,.27,.215),.91)
letters = material('Brushed lettering', (.77,.8,.83),.32,.65)

def box(name, at, size, mat, bevel=0):
    x,y,z=at; w,h,d=size
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x,-z,y))
    o=bpy.context.object; o.name=name; o.scale=(w,d,h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(mat)
    if bevel:
        m=o.modifiers.new('Edge highlights','BEVEL'); m.width=bevel; m.segments=2
        bpy.ops.object.modifier_apply(modifier=m.name)
    return o

box('Goldberg core',(-1,10.5,0),(29,21,52),dark)
box('Glazed lobby',(14.08,2.1,0),(.18,4.1,51.6),glass[1])
for i in range(26):
    z=-25+i*2
    for j in range(8):
        glazed=6<=i<=20 and j>0 and not(i in [10,17] and j in [3,6])
        box('Recessed window' if glazed else 'Zinc panel',(14.45 if glazed else 14.65,5.05+j*1.98,z),(.12,1.94,1.96),random.choice(glass if glazed else panel),.012)
    box('Lobby mullion',(14.28,2.1,z),(.2,4.2,.065),dark)
for y in [4.04,8.05,12.01,15.97,19.93]: box('Horizontal rail',(14.76,y,0),(.13,.075,52),panel[2])
for z in [-26,26]:
    for i in range(15):
        for j in range(10):
            glazed=i%5 in [1,2] and j not in [0,2]
            box('Side return',(-14+i*2,1+j*2,z),(1.96,1.96,.15),random.choice(glass if glazed else panel),.012)
box('Roof deck',(0,21.08,0),(30,.24,52),roof)
for z in [-26,26]: box('Parapet',(0,21.5,z),(30,.85,.25),panel[2])
for x in [-15,15]: box('Parapet',(x,21.5,0),(.25,.85,52),panel[2])
box('Roof plant room',(-5,22.3,-6),(9,2.3,13),panel[1],.06)
for z in [-16,10,16]:
    box('Air handling unit',(3,22,z),(4.3,1.5,3.4),panel[3],.06)
    for k in range(9): box('Vent grille',(5.18,22,z-1.4+k*.35),(.06,1.1,.045),dark)
box('Roof duct',(3,21.65,-1),(1.2,.85,24),panel[3],.08)
for z in [-2.1,0,2.1]:
    box('Entrance glass',(14.8,1.45,z),(.1,2.9,1.95),glass[0])
    for dz in [-1,1]: box('Door jamb',(14.92,1.5,z+dz),(.14,3,.065),letters)
    box('Transom',(14.92,3,z),(.14,.08,2.1),letters)
    box('Door pull',(15.04,1.3,z+.68),(.05,.7,.06),letters)
box('Entrance canopy',(17,3.4,0),(4.8,.16,9),panel[3],.035)

def sign(body,y,size):
    c=bpy.data.curves.new(body,'FONT'); c.body=body; c.size=size; c.align_x='CENTER'; c.extrude=.025; c.bevel_depth=.008
    o=bpy.data.objects.new(body,c); bpy.context.collection.objects.link(o)
    o.location=(14.85,0,y); o.rotation_euler=(math.pi/2,0,math.pi/2)
    c.materials.append(letters)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active=o
    bpy.ops.object.convert(target='MESH'); o.select_set(False)
sign('Goldberg Computer Science Building',4.4,.66)
sign('DALHOUSIE UNIVERSITY',19.45,.95)

box('District ground',(0,-.45,0),(2200,.8,2200),grass)
box('University Avenue',(29,.005,0),(12,.06,420),road)
box('Henry Street',(0,.007,37),(380,.06,11),road)
for x in [21.5,36.5]: box('Sidewalk',(x,.12,0),(2.8,.22,420),stone)
for z in [29.8,44.2]: box('Sidewalk',(0,.12,z),(380,.22,2.8),stone)
box('Forecourt',(18,.12,0),(8,.24,55),stone)
for z in range(-200,210,10): box('Avenue dash',(29,.045,z),(.14,.02,4.5),line)
for z in [-2.8,-1.7,-.6,.5,1.6,2.7]: box('Crosswalk',(29,.047,29+z),(10,.02,.5),line)
for x,z,w,d,h in [(-53,-8,30,40,16),(-52,62,34,26,19),(64,-28,32,34,17),(66,65,36,29,20),(-105,-68,38,30,12),(-102,66,42,30,15),(113,-80,30,38,14)]:
    box('Neighbour building',(x,h/2,z),(w,h,d),brick)
    box('Neighbour roof',(x,h+.12,z),(w+.2,.3,d+.2),roof)
    for dz in range(-int(d/2)+3,int(d/2)-2,4):
        for y in range(3,h-1,3): box('Neighbour window',(x+w/2+.015,y,z+dz),(.04,1.6,1.7),glass[1])
for z in [-21,-9,11,23]:
    box('Campus bench',(19.5,.48,z),(.6,.14,2.2),panel[0],.025)
    for dz in [-.8,.8]: box('Bench foot',(19.5,.22,z+dz),(.5,.44,.1),dark)

# Distant city blocks carry the ground into the atmospheric haze; no floating rectangular island.
for x in range(-750,750,65):
    for z in range(-750,750,65):
        if abs(x)<165 and abs(z)<165: continue
        w=random.uniform(18,39); d=random.uniform(22,44); h=random.uniform(7,21)
        box('Distant block',(x,h/2,z),(w,h,d),brick)
        box('Distant roof',(x,h+.1,z),(w+.2,.22,d+.2),roof)
for x in range(-750,750,65):
    box('Distant street',(x+27,.015,0),(8,.04,1600),road)
for z in range(-750,750,65):
    box('Distant street',(0,.016,z+29),(1600,.04,7),road)

out=Path('.cache/flight'); out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str((out/'campus.blend').resolve()))
bpy.ops.export_scene.gltf(filepath=str((out/'campus.glb').resolve()),export_format='GLB',export_yup=True,export_cameras=False,export_lights=False)
print('[flight] Exported dimensional campus:',len(bpy.context.scene.objects),'objects')
