"""Export game parts from SportSnake_Optimized.blend without changing the source file.
Run with Blender --background SOURCE.blend --python scripts/export-sport-snake.py.
"""
import bpy
from mathutils import Matrix, Vector
from pathlib import Path

OUTPUT = Path(__file__).resolve().parents[1] / 'public' / 'sport-snake.glb'
for obj in bpy.data.objects:
    if obj.name.startswith('CTRL_'):
        obj.location = (0, 0, 0)
bpy.context.view_layer.update()

names = ['Head_Upper', 'Head_Lower', 'Eyeball_L', 'Eyeball_R', 'Pupil_L', 'Pupil_R', 'Tongue', 'Body_Segment', 'Tail_Segment']
source = {name: bpy.data.objects[name] for name in names}
head_names = names[:7]
scale = .95 / 3.502535104751587
# Free stable runtime node names without modifying the original .blend on disk.
for obj in bpy.data.objects:
    obj.name = 'SOURCE_' + obj.name
scene = bpy.data.scenes.new('SportSnake_Game')
bpy.context.window.scene = scene

def empty(name, parent=None, location=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    return obj

def mesh(name, parent, transform):
    original = source[name]
    data = original.data.copy()
    # Bake neutral world transforms into mesh and every tongue morph target.
    data.transform(transform @ original.matrix_world, shape_keys=True)
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.parent = parent
    if data.shape_keys:
        data.shape_keys.animation_data_clear()
        for key in data.shape_keys.key_blocks:
            key.value = 0
    return obj

head_points = [source[n].matrix_world @ Vector(v) for n in head_names for v in source[n].bound_box]
head_y = (min(v.y for v in head_points) + max(v.y for v in head_points)) / 2
head_floor = min(v.z for v in head_points)
head_transform = Matrix.Scale(scale, 4) @ Matrix.Translation((0, -head_y, -head_floor))
head = empty('SportHead')
jaw_position = head_transform @ source['Head_Lower'].matrix_world.translation
jaw = empty('JawPivot', head, jaw_position)
for name in head_names:
    if name == 'Head_Lower':
        mesh(name, jaw, Matrix.Translation(-jaw_position) @ head_transform)
    else:
        mesh(name, head, head_transform)

for name, root_name, length in [('Body_Segment', 'SportBody', 1.04), ('Tail_Segment', 'SportTail', 1.12)]:
    obj = source[name]
    points = [obj.matrix_world @ Vector(v) for v in obj.bound_box]
    center_x = (min(v.x for v in points) + max(v.x for v in points)) / 2
    center_y = (min(v.y for v in points) + max(v.y for v in points)) / 2
    floor = min(v.z for v in points)
    depth = max(v.y for v in points) - min(v.y for v in points)
    transform = Matrix.Diagonal((scale, length / depth, scale, 1)) @ Matrix.Translation((-center_x, -center_y, -floor))
    mesh(name, empty(root_name), transform)

bpy.context.view_layer.update()
bpy.ops.export_scene.gltf(filepath=str(OUTPUT), export_format='GLB', use_active_scene=True, use_selection=False,
    export_animations=False, export_morph=True, export_yup=True, export_cameras=False,
    export_lights=False, export_extras=True)
print('EXPORTED', OUTPUT)
