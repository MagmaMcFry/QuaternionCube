#!/usr/bin/python3

from math import pi, sin, cos

epsilon = 0.000001

colors = [
	[1, 0, 0],
	[1, 0.5, 0],
	[0, 0, 1],
	[0, 1, 0],
	[1, 1, 0],
	[1, 1, 1],
]

####### Panels ########

class Panel:
	# pos: tuple of x, y, z coordinates (centered in front of cubie)
	# _box: AABB as triple of intervals
	pass

panels = []

def sgn(x):
	if x < 0: return -1
	if x > 0: return 1
	return 0

for x in range(-2, 3):
	for y in range(-2, 3):
		for z in range(-2, 3):
			stuple = tuple(sorted(map(abs, [x, y, z])))
			if stuple[1] < 2:
				panel = Panel()
				panel.pos = tuple([x, y, z])
				panel.cubie_center = tuple([2*sgn(x), 2*sgn(y), 2*sgn(z)])
				panel.outer = (stuple[2] == 2)
				panels.append(panel)

panel_margin = 0.1
panel_extents = [
	[-3-panel_margin, -3],
	[-3+panel_margin, -1-panel_margin],
	[-1+panel_margin, 1-panel_margin],
	[1+panel_margin, 3-panel_margin],
	[3, 3+panel_margin]
]
cubie_extents = [
	[-3, -1],
	[-1, 1],
	[1, 3],
]

for panel in panels:
	if panel.outer:
		panel.box = [
			panel_extents[panel.pos[0]+2],
			panel_extents[panel.pos[1]+2],
			panel_extents[panel.pos[2]+2],
		]
	else:
		panel.box = [
			cubie_extents[panel.pos[0]+1],
			cubie_extents[panel.pos[1]+1],
			cubie_extents[panel.pos[2]+1],
		]

######## Rotations #########

class Rotation:
	# dim: index of dimension of rotation axis
	# axis: rotation axis direction as tuple
	# angle: rotation angle
	# quaternion: rotation quaternion
	# rotperm: conjugation matrix (unused)
	# matrix: transformation matrix
	pass

rotations = []

for dim in range(3):
	for sign in [-1, +1]:
		rotation = Rotation()
		rotation.dim = dim
		rotation.axis = tuple([sign * int(dim == i) for i in range(3)])
		rotation.angle = pi/2
		rotations.append(rotation)

def dot(a, b):
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

def cross(a, b):
	return (
		a[1] * b[2] - a[2] * b[1],
		a[2] * b[0] - a[0] * b[2],
		a[0] * b[1] - a[1] * b[0],
	)

def det(a, b, c):
	return dot(a, cross(b, c))

def manhattan_dist(a, b):
	return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])

for i0, rot0 in enumerate(rotations):
	vec0 = rot0.axis
	rot0.rotperm = [0] * len(rotations)
	for i1, rot1 in enumerate(rotations):
		vec1 = rot1.axis
		if dot(vec0, vec1) != 0:
			rot0.rotperm[i1] = i1
		else:
			for i2, rot2 in enumerate(rotations):
				vec2 = rot2.axis
				if det(vec0, vec1, vec2) == 1:
					rot0.rotperm[i1] = i2

for rotation in rotations:
	rotation.matrix = [
		rotations[rotation.rotperm[1]].axis,
		rotations[rotation.rotperm[3]].axis,
		rotations[rotation.rotperm[5]].axis,
	]

def apply_rotation(rotation, vector):
	return (
		rotation.matrix[0][0] * vector[0] + rotation.matrix[0][1] * vector[1] + rotation.matrix[0][2] * vector[2],
		rotation.matrix[1][0] * vector[0] + rotation.matrix[1][1] * vector[1] + rotation.matrix[1][2] * vector[2],
		rotation.matrix[2][0] * vector[0] + rotation.matrix[2][1] * vector[1] + rotation.matrix[2][2] * vector[2],
	)

for panel in panels:
	if panel.outer:
		for i, rotation in enumerate(rotations):
			if dot(panel.pos, rotation.axis) == 2:
				panel.color = i
	else:
		panel.color = -1
######## Quaternions ##########

class Quaternion:
	# x, y, z, w: coordinates
	def __init__(self, w, x, y, z):
		self.w = w
		self.x = x
		self.y = y
		self.z = z

	def approxeq(self, other):
		return (abs(self.w - other.w) < epsilon
			and abs(self.x - other.x) < epsilon
			and abs(self.y - other.y) < epsilon
			and abs(self.z - other.z) < epsilon)

	def multiply(self, other):
		return Quaternion(
			self.w * other.w - self.x * other.x - self.y * other.y - self.z * other.z,
			self.w * other.x + self.x * other.w + self.y * other.z - self.z * other.y,
			self.w * other.y + self.y * other.w + self.z * other.x - self.x * other.z,
			self.w * other.z + self.z * other.w + self.x * other.y - self.y * other.x,
		)

quaternions = []

def find_quaternion(q):
	for i, p in enumerate(quaternions):
		if p.approxeq(q):
			return i
	return -1

def add_quaternion(q):
	if find_quaternion(q) == -1:
		quaternions.append(q)

add_quaternion(Quaternion(1, 0, 0, 0))
for rotation in rotations:
	w = cos(rotation.angle/2)
	x = sin(rotation.angle/2) * rotation.axis[0]
	y = sin(rotation.angle/2) * rotation.axis[1]
	z = sin(rotation.angle/2) * rotation.axis[2]
	q = Quaternion(w, x, y, z)
	add_quaternion(q)
	rotation.quaternion = find_quaternion(q)

oldqlen = 0
while oldqlen != len(quaternions):
	oldqlen = len(quaternions)
	for p in list(quaternions):
		for q in list(quaternions):
			add_quaternion(p.multiply(q))

quaternion_table = []
for p in quaternions:
	quaternion_table.append([])
	for q in quaternions:
		quaternion_table[-1].append(find_quaternion(p.multiply(q)))

######## Moves #########
class Move:
	# affected_panels: list of affected panel IDs
	# quaternion: rotation quaternion
	# panel_perm: panel permutation array
	pass

moves = []

for rotation in rotations:
	for plane in [-1, 0, 1]:
		move = Move()
		move.affected_panels = [0] * len(panels)
		move.axis = rotation.axis
		move.fraction = 4
		move.quaternion = rotation.quaternion
		move.panel_perm = list(range(len(panels)))
		for i0, panel0 in enumerate(panels):
			if sgn(panel0.pos[rotation.dim]) == plane:
				move.affected_panels[i0] = 1
				for i1, panel1 in enumerate(panels):
					if panel1.pos == apply_rotation(rotation, panel0.pos):
						move.panel_perm[i0] = i1
		moves.append(move)

move_opposites = [-1] * len(moves)
for m, move in enumerate(moves):
	for mi, opposite in enumerate(moves):
		is_opposite = True
		for i in range(len(panels)):
			if opposite.panel_perm[move.panel_perm[i]] != i:
				is_opposite = False
		if is_opposite:
			move_opposites[m] = mi
			break

######## Move table #########

def move_distance(old_panel, new_panel, moved_panel, old_affected, new_affected):
	if not old_affected:
		return 100
	if new_panel == old_panel:
		return 100
	if moved_panel == old_panel:
		return 100
	if new_panel.color == moved_panel.color and new_panel.color != old_panel.color:
		return 0
	if old_affected and new_affected:
		return manhattan_dist(moved_panel.pos, new_panel.pos) + 10 * int(moved_panel.color == old_panel.color)
	return 100

move_table = []
for i in range(len(panels)):
	move_table.append([-1] * len(panels))

for i_old, old_panel in enumerate(panels):
	for i_new, new_panel in enumerate(panels):
		if i_old == i_new or not (old_panel.outer and new_panel.outer):
			continue
		best_move = -1
		best_distance = 50
		for mi, move in enumerate(moves):
			i_moved = move.panel_perm[i_old]
			moved_panel = panels[i_moved]
			i_moved_new = move.panel_perm[i_new]

			distance = move_distance(old_panel, new_panel, moved_panel, i_old != i_moved, i_new != i_moved_new)
			if (distance < best_distance):
				best_move = mi
				best_distance = distance

		move_table[i_old][i_new] = best_move

######### Cleanup for export ###########

for panel in panels:
	del panel.outer
	panel.pos = list(panel.pos)
	panel.cubie_center = list(panel.cubie_center)

for move in moves:
	move.axis = list(move.axis)

for quaternion in quaternions:
	quaternion.w = round(quaternion.w, 4)
	quaternion.x = round(quaternion.x, 4)
	quaternion.y = round(quaternion.y, 4)
	quaternion.z = round(quaternion.z, 4)

######### Output ###########

def print_obj_array(name, objects):
	print(f"  {name}: [")
	for obj in objects:
		print(f"    {vars(obj)},")
	print("  ],")

def print_matrix(name, matrix):
	print(f"  {name}: [")
	for row in matrix:
		print(f"    {row},")
	print("  ],")

def print_attr(name, attr):
	print(f"  {name}: {attr},")

print("// This file is autogenerated by generate_data.py.")
print("const CUBE_DATA = {")
print_attr("size", 3)
print_matrix("colors", colors)
print_obj_array("panels", panels)
print_obj_array("moves", moves)
print_attr("move_opposites", move_opposites)
print_matrix("move_table", move_table)
print_obj_array("quaternions", quaternions)
print_matrix("quaternion_table", quaternion_table)
print("};")
print("// This file is autogenerated by generate_data.py.")
