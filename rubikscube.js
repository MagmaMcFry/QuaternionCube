'use strict';

function rubikscube(n) {
	// Side order: -x, +x, -y, +y, -z, +z
	// X: right
	// Y: front
	// Z: top

	// Red, orange, blue, green, yellow, white
	// R, L, B, F, D, U
	const black_color = 0x808080;
	const side_colors = [0xbb0000, 0xbb6000, 0x0000bb, 0x00bb00, 0xbbbb00, 0xbbbbbb];
	const hilit_side_colors = [0xff0000, 0xff8000, 0x0000ff, 0x00ff00, 0xffff00, 0xffffff];

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

	let panel_count = undefined;
	let panel_positions = [];
	let panel_colors = [];
	let move_count = undefined;
	let move_permutations = [];
	let move_affected_cubies = [];
	let rot_directions = [];



	const init = function() {
		// panels
		for (let z = 0; z < n; ++z) {
			for (let y = 0; y < n; ++y) {
				for (let x = 0; x < n; ++x) {
					const outsides = [x == 0, x == n-1, y == 0, y == n-1, z == 0, z == n-1];
					for (let s = 0; s < 6; ++s) {
						if (outsides[s]) {
							panel_positions.push({vec: [x, y, z], x: x, y: y, z: z, side: s});
							panel_colors.push(s);
						}
					}
				}
			}
		}
		panel_count = panel_colors.length;

		// Moves
		for (let slice = 0; slice < n; ++slice) {
			for (let side = 0; side < 6; ++side) {
				let move = [];
				for (let i = 0; i < panel_count; ++i) {
					move.push(rotate_panel_slow(i, side, slice));
				}
				move_permutations.push(move);
				rot_directions.push(directions[side]);
				const current_move_affected_cubies = [];
				move_affected_cubies.push(current_move_affected_cubies);
				for (let z = 0; z < n; ++z) {
					current_move_affected_cubies.push([]);
					for (let y = 0; y < n; ++y) {
						current_move_affected_cubies[z].push([]);
						for (let x = 0; x < n; ++x) {
							current_move_affected_cubies[z][y].push(is_cubie_affected_slow([x, y, z], side, slice));
						}
					}
				}
			}
		}
		move_count = 6 * n;
	};

	const find_panel = function(x, y, z, s) {
		for (let i = 0; i < panel_count; ++i) {
			const panel = panel_positions[i];
			if (panel.x == x && panel.y == y && panel.z == z && panel.side == s) {
				return i;
			}
		}
		console.error("Cannot find given panel!");
		return -1;
	};

	const apply_rotation = function(vector, rot_side) {
		const mat = rotation_mats[rot_side];
		return [
			mat[0][0] * vector[0] + mat[0][1] * vector[1] + mat[0][2] * vector[2],
			mat[1][0] * vector[0] + mat[1][1] * vector[1] + mat[1][2] * vector[2],
			mat[2][0] * vector[0] + mat[2][1] * vector[1] + mat[2][2] * vector[2],
		];
	};

	const rotate_cubie = function(cubie_pos, rot_side) {
		let vec = apply_rotation(cubie_pos, rot_side);
		const compensation = apply_rotation([1,1,1], rot_side);
		for (let i = 0; i < 3; ++i) {
			if (compensation[i] < 0) {
				vec[i] += n - 1;
			}
		}
		return vec;
	};

	const rotate_side = function(affected_side, rot_side) {
		return rotations[rot_side][affected_side];
	};

	const is_cubie_affected_slow = function(cubie_pos, rot_side, rot_slice) {
		return cubie_pos[rotation_dims[rot_side]] == rot_slice;
	};

	const rotate_panel_slow = function(panel_id, rot_side, rot_slice) {
		const pos = panel_positions[panel_id];
		const oldvec = pos.vec;
		const oldside = pos.side;
		if (!is_cubie_affected_slow(pos.vec, rot_side, rot_slice)) {
			return panel_id;
		}
		const newvec = rotate_cubie(oldvec, rot_side);
		const newside = rotate_side(oldside, rot_side);
		return find_panel(newvec[0], newvec[1], newvec[2], newside);
	};

	const is_cubie_affected = function(cubie_x, cubie_y, cubie_z, move_id) {
		return move_affected_cubies[move_id][cubie_z][cubie_y][cubie_x];
	};

	const apply_move = function(move_id) {
		const move = move_permutations[move_id];
		const old_panel_colors = panel_colors.slice();
		for (let i = 0; i < panel_count; ++i) {
			panel_colors[move[i]] = old_panel_colors[i];
		}
	};

	const try_rotate = function(old_panel, new_panel) {
		if (old_panel == new_panel) return -1;
		let old_pos = panel_positions[old_panel];
		let new_pos = panel_positions[new_panel];

		let best_move = -1;
		let best_distance = (n+2)*(n+2);
		for (let m = 0; m < move_count; ++m) {
			let moved_panel = move_permutations[m][old_panel];
			let moved_pos = panel_positions[moved_panel];
			if (moved_panel != old_panel && moved_pos.side != old_pos.side) {
				let distance = Math.abs(moved_pos.x - new_pos.x)
					+ Math.abs(moved_pos.y - new_pos.y)
					+ Math.abs(moved_pos.z - new_pos.z)
					+ (n+2) * (moved_pos.side != new_pos.side);
				if (distance < best_distance) {
					best_move = m;
					best_distance = distance;
				}
			}
		}
		return best_move;
	};


	let R_cubies = [];
	let R_panels = [];
	let R_color_materials = [];
	let R_hilit_color_materials = [];
	let R_root = undefined;
	let R_main = undefined;

	const R_init = function() {
		R_root = new THREE.Object3D();
		R_main = new THREE.Object3D();
		const black_material = new THREE.MeshBasicMaterial({color: black_color});
		const cubie_geometry = new THREE.BoxGeometry(1, 1, 1);
		const panel_geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
		for (let c = 0; c < 6; ++c) {
			R_color_materials.push(new THREE.MeshBasicMaterial({color: side_colors[c]}));
			R_hilit_color_materials.push(new THREE.MeshBasicMaterial({color: hilit_side_colors[c]}));
		}
		for (let z = 0; z < n; ++z) {
			R_cubies.push([]);
			for (let y = 0; y < n; ++y) {
				R_cubies[z].push([]);
				for (let x = 0; x < n; ++x) {
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
		for (let i = 0; i < panel_count; ++i) {
			const panel = panel_positions[i];
			const panel_material = R_color_materials[panel_colors[i]];
			const panel_mesh = new THREE.Mesh(panel_geometry, panel_material);
			const panel_direction = directions[panel.side];
			panel_mesh.position.x = panel.x + 0.1*panel_direction[0] + (1-n)/2;
			panel_mesh.position.y = panel.y + 0.1*panel_direction[1] + (1-n)/2;
			panel_mesh.position.z = panel.z + 0.1*panel_direction[2] + (1-n)/2;
			R_cubies[panel.z][panel.y][panel.x].add(panel_mesh);
			R_panels.push(panel_mesh);
		}
		R_main.scale.x = 1/n;
		R_main.scale.y = 1/n;
		R_main.scale.z = 1/n;

		R_root.add(R_main);

	};

	const R_update_panels = function(...highlighted_panels) {
		for (let i = 0; i < panel_count; ++i) {
			if (highlighted_panels.includes(i)) {
				R_panels[i].material = R_hilit_color_materials[panel_colors[i]];
			} else {
				R_panels[i].material = R_color_materials[panel_colors[i]];
			}
		}
	};

	const R_set_current_rotation = function(rot_id, amount) {
		const rot_dir = rot_directions[rot_id];
		for (let z = 0; z < n; ++z) {
			for (let y = 0; y < n; ++y) {
				for (let x = 0; x < n; ++x) {
					const cubie = R_cubies[z][y][x];
					if (is_cubie_affected(x, y, z, rot_id)) {
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
	};

	const R_get_panel = function(raycaster) {
		let result_array = raycaster.intersectObject(R_root, true);
		if (result_array.length == 0) {
			//console.log("No intersections found");
			return -1;
		}
		for (let i = 0; i < R_panels.length; ++i) {
			if (R_panels[i] == result_array[0].object) {
				return i;
			}
		}
		//console.log("Invalid intersection found");
		return -1;
	};

	init();
	R_init();


	return {
		get_move_count: function() { return move_count; },
		get_root: function() { return R_root; },
		apply_move: apply_move,
		update_panels: R_update_panels,
		set_current_rotation: R_set_current_rotation,
		get_panel: R_get_panel,
		try_rotate: try_rotate,
	};
}
