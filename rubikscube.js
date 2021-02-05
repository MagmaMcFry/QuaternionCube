'use strict';

function rubikscube(n) {
	// Side order: -x, +x, -y, +y, -z, +z
	// X: right
	// Y: front
	// Z: top

	// Red, orange, blue, green, yellow, white
	// R, L, B, F, D, U
	const black_color = 0x808080;
	const side_colors = [0xff0000, 0xff8000, 0x0000ff, 0x00ff00, 0xffff00, 0xffffff];

	const directions = [
		[-1, 0, 0],
		[+1, 0, 0],
		[0, -1, 0],
		[0, +1, 0],
		[0, 0, -1],
		[0, 0, +1],
	];
	// Rotations are counterclockwise around sides in order
	const rotations = [
		[0, 1, 5, 4, 2, 3],
		[0, 1, 4, 5, 3, 2],
		[4, 5, 2, 3, 1, 0],
		[5, 4, 2, 3, 0, 1],
		[3, 2, 0, 1, 4, 5],
		[2, 3, 1, 0, 4, 5],
	];

	const rotation_dims = [
		0, 0, 1, 1, 2, 2
	];

	// Rotation matrices are applied forwards.
	const rotation_mats = [
		[
			[+1, 0, 0],
			[0, 0, +1],
			[0, -1, 0],
		],
		[
			[+1, 0, 0],
			[0, 0, -1],
			[0, +1, 0],
		],
		[
			[0, 0, -1],
			[0, +1, 0],
			[+1, 0, 0],
		],
		[
			[0, 0, +1],
			[0, +1, 0],
			[-1, 0, 0],
		],
		[
			[0, +1, 0],
			[-1, 0, 0],
			[0, 0, +1],
		],
		[
			[0, -1, 0],
			[+1, 0, 0],
			[0, 0, +1],
		],
	];

	let plate_count = undefined;
	let plate_positions = [];
	let plate_colors = [];
	let move_count = undefined;
	let move_permutations = [];
	let move_affected_cubies = [];
	let rot_directions = [];


	let R_cubies = [];
	let R_plates = [];
	let R_color_materials = [];
	let R_root = undefined;
	let R_main = undefined;


	const Cube = {
		init: function() {
			// Plates
			for (var z = 0; z < n; ++z) {
				for (var y = 0; y < n; ++y) {
					for (var x = 0; x < n; ++x) {
						const outsides = [x == 0, x == n-1, y == 0, y == n-1, z == 0, z == n-1];
						for (var s = 0; s < 6; ++s) {
							if (outsides[s]) {
								plate_positions.push({vec: [x, y, z], x: x, y: y, z: z, side: s});
								plate_colors.push(s);
							}
						}
					}
				}
			}
			plate_count = plate_colors.length;

			// Moves
			for (var slice = 0; slice < n; ++slice) {
				for (var side = 0; side < 6; ++side) {
					let move = [];
					for (var i = 0; i < plate_count; ++i) {
						move.push(this.rotate_plate_slow(i, side, slice));
					}
					move_permutations.push(move);
					rot_directions.push(directions[side]);
					const current_move_affected_cubies = [];
					move_affected_cubies.push(current_move_affected_cubies);
					for (var z = 0; z < n; ++z) {
						current_move_affected_cubies.push([]);
						for (var y = 0; y < n; ++y) {
							current_move_affected_cubies[z].push([]);
							for (var x = 0; x < n; ++x) {
								current_move_affected_cubies[z][y].push(this.is_cubie_affected_slow([x, y, z], side, slice));
							}
						}
					}
				}
			}
			move_count = 6 * n;
		},

		find_plate: function(x, y, z, s) {
			for (var i = 0; i < plate_count; ++i) {
				const plate = plate_positions[i];
				if (plate.x == x && plate.y == y && plate.z == z && plate.side == s) {
					return i;
				}
			}
			console.error("Cannot find given plate!");
			return -1;
		},

		apply_rotation: function(vector, rot_side) {
			const mat = rotation_mats[rot_side];
			return [
				mat[0][0] * vector[0] + mat[0][1] * vector[1] + mat[0][2] * vector[2],
				mat[1][0] * vector[0] + mat[1][1] * vector[1] + mat[1][2] * vector[2],
				mat[2][0] * vector[0] + mat[2][1] * vector[1] + mat[2][2] * vector[2],
			];
		},

		rotate_cubie: function(cubie_pos, rot_side) {
			let vec = this.apply_rotation(cubie_pos, rot_side);
			const compensation = this.apply_rotation([1,1,1], rot_side);
			for (var i = 0; i < 3; ++i) {
				if (compensation[i] < 0) {
					vec[i] += n - 1;
				}
			}
			return vec;
		},

		rotate_side: function(affected_side, rot_side) {
			return rotations[rot_side][affected_side];
		},

		is_cubie_affected_slow: function(cubie_pos, rot_side, rot_slice) {
			return cubie_pos[rotation_dims[rot_side]] == rot_slice;
		},

		rotate_plate_slow: function(plate_id, rot_side, rot_slice) {
			const pos = plate_positions[plate_id];
			const oldvec = pos.vec;
			const oldside = pos.side;
			if (!this.is_cubie_affected_slow(pos.vec, rot_side, rot_slice)) {
				return plate_id;
			}
			const newvec = this.rotate_cubie(oldvec, rot_side);
			const newside = this.rotate_side(oldside, rot_side);
			return this.find_plate(newvec[0], newvec[1], newvec[2], newside);
		},

		is_cubie_affected: function(cubie_x, cubie_y, cubie_z, rot_id) {
			return move_affected_cubies[rot_id][cubie_z][cubie_y][cubie_x];
		},

		rotate_plate: function(plate_id, rot_id) {
			return move_permutations[rot_id][plate_id];
		},

		get_move_count: function() {
			return move_count;
		},

		apply_move: function(rot_id) {
			const move = move_permutations[rot_id];
			const old_plate_colors = plate_colors.slice();
			for (var i = 0; i < plate_count; ++i) {
				plate_colors[move[i]] = old_plate_colors[i];
			}
		},

		R_init: function() {
			R_root = new THREE.Object3D();
			R_main = new THREE.Object3D();
			const black_material = new THREE.MeshBasicMaterial({color: black_color});
			const cubie_geometry = new THREE.BoxGeometry(1, 1, 1);
			const plate_geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
			for (var c = 0; c < 6; ++c) {
				R_color_materials.push(new THREE.MeshBasicMaterial({color: side_colors[c]}));
			}
			for (var z = 0; z < n; ++z) {
				R_cubies.push([]);
				for (var y = 0; y < n; ++y) {
					R_cubies[z].push([]);
					for (var x = 0; x < n; ++x) {
						const cubie_object = new THREE.Object3D();
						//const cubie_material = new THREE.MeshBasicMaterial({color: Math.floor(Math.random()*0xffffff)}); // 0x0f0f0f
						const cubie_mesh = new THREE.Mesh(cubie_geometry, black_material);
						cubie_mesh.position.x = x + (1-n)/2;
						cubie_mesh.position.y = y + (1-n)/2;
						cubie_mesh.position.z = z + (1-n)/2;
						cubie_object.add(cubie_mesh);
						R_cubies[z][y].push(cubie_object);
						R_main.add(cubie_object);
					}
				}
			}
			for (var i = 0; i < plate_count; ++i) {
				const plate = plate_positions[i];
				const plate_material = R_color_materials[plate_colors[i]];
				const plate_mesh = new THREE.Mesh(plate_geometry, plate_material);
				const plate_direction = directions[plate.side];
				plate_mesh.position.x = plate.x + 0.1*plate_direction[0] + (1-n)/2;
				plate_mesh.position.y = plate.y + 0.1*plate_direction[1] + (1-n)/2;
				plate_mesh.position.z = plate.z + 0.1*plate_direction[2] + (1-n)/2;
				R_cubies[plate.z][plate.y][plate.x].add(plate_mesh);
				R_plates.push(plate_mesh);
			}
			R_main.scale.x = 1/n;
			R_main.scale.y = 1/n;
			R_main.scale.z = 1/n;

			R_root.add(R_main);
		},

		R_update_plates: function() {
			for (var i = 0; i < plate_count; ++i) {
				R_plates[i].material = R_color_materials[plate_colors[i]];
			}
		},

		R_set_current_rotation: function(rot_id, amount) {
			const rot_dir = rot_directions[rot_id];
			for (var z = 0; z < n; ++z) {
				for (var y = 0; y < n; ++y) {
					for (var x = 0; x < n; ++x) {
						const cubie = R_cubies[z][y][x];
						if (this.is_cubie_affected(x, y, z, rot_id)) {
							cubie.rotation.x = amount * rot_dir[0] * Math.PI/2;
							cubie.rotation.y = amount * rot_dir[1] * Math.PI/2;
							cubie.rotation.z = amount * rot_dir[2] * Math.PI/2;
						} else {
							cubie.rotation.x = 0;
							cubie.rotation.y = 0;
							cubie.rotation.z = 0;
						}
					}
				}
			}
		},

		R_get_root: function() {
			return R_root
		},
	};

	Cube.init();
	Cube.R_init();
	return Cube;
}
