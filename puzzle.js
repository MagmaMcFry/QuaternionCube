'use strict';

function _create_geometry(box) {
	let x0 = box[0][0];
	let x1 = box[0][1];
	let y0 = box[1][0];
	let y1 = box[1][1];
	let z0 = box[2][0];
	let z1 = box[2][1];

	let geometry = new THREE.BufferGeometry();
	const vertices = new Float32Array([
		x0, y0, z0,
		x0, y0, z1,
		x0, y1, z1,
		x0, y0, z0,
		x0, y1, z1,
		x0, y1, z0,

		x0, y0, z0,
		x1, y0, z0,
		x1, y0, z1,
		x0, y0, z0,
		x1, y0, z1,
		x0, y0, z1,

		x0, y0, z0,
		x0, y1, z0,
		x1, y1, z0,
		x0, y0, z0,
		x1, y1, z0,
		x1, y0, z0,

		x1, y0, z0,
		x1, y1, z0,
		x1, y1, z1,
		x1, y0, z0,
		x1, y1, z1,
		x1, y0, z1,

		x0, y0, z1,
		x1, y0, z1,
		x1, y1, z1,
		x0, y0, z1,
		x1, y1, z1,
		x0, y1, z1,

		x0, y1, z0,
		x0, y1, z1,
		x1, y1, z1,
		x0, y1, z0,
		x1, y1, z1,
		x1, y1, z0,
	]);
	geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
	return geometry;
}

function gen_puzzle_from_data(data) {
	let black_material = new THREE.MeshBasicMaterial({color: 0x808080});
	let color_materials = [];
	let hilit_materials = [];
	let quaternion_materials = [];
	for (let i = 0; i < data.colors.length; ++i) {
		let color = data.colors[i];
		color_materials[i] = new THREE.MeshBasicMaterial({color: new THREE.Color(0.8*color[0], 0.8*color[1], 0.8*color[2])});
		hilit_materials[i] = new THREE.MeshBasicMaterial({color: new THREE.Color(color[0], color[1], color[2])});
	}
	let panel_meshes = [];
	let root = new THREE.Object3D();
	let show_quaternions = true;
	root.scale.x = 1/data.size;
	root.scale.y = 1/data.size;
	root.scale.z = 1/data.size;

	for (let i = 0; i < data.panels.length; ++i) {
		let panel = data.panels[i];
		let geometry = _create_geometry(panel.box);
		let mesh = new THREE.Mesh(geometry, black_material);
		root.add(mesh);
		panel_meshes[i] = mesh;

		if (panel.color < 0) {
			quaternion_materials[i] = black_material;
		} else {
			let cubie_center = new THREE.Vector3(
				panel.cubie_center[0],
				panel.cubie_center[1],
				panel.cubie_center[2],
				);
			quaternion_materials[i] = new THREE.ShaderMaterial(
				{
					uniforms: {
						cubie_center: { value: cubie_center },
						quaternion: {value: new THREE.Vector4(0, 1, 0, 0)},
					},
					vertexShader: VERTEX_SHADER,
					fragmentShader: FRAGMENT_SHADER,
				}
			);
		}
	}

	let panel_colors = [];
	let panel_quaternions = [];

	for (let i = 0; i < data.panels.length; ++i) {
		panel_colors[i] = data.panels[i].color;
		panel_quaternions[i] = 0;
	}

	return {
		get_move_count: function() { return data.moves.length; },
		get_root: function() { return root; },
		apply_move: function(move_id) {
			let move = data.moves[move_id];
			let perm = move.panel_perm;
			let old_panel_colors = panel_colors.slice();
			let old_panel_quaternions = panel_quaternions.slice();
			for (let i = 0; i < data.panels.length; ++i) {
				panel_colors[perm[i]] = old_panel_colors[i];
				if (move.affected_panels[i] > 0) {
					panel_quaternions[perm[i]] = data.quaternion_table[old_panel_quaternions[i]][move.quaternion];
				}
			}
		},

		update_panels: function(...highlighted_panels) {
			for (let i = 0; i < data.panels.length; ++i) {
				let c = panel_colors[i];
				if (c < 0) {
					// Stay gray
				} else if (show_quaternions) {
					panel_meshes[i].material = quaternion_materials[i];
					let quaternion_id = panel_quaternions[i];
					quaternion_materials[i].uniforms.quaternion.value = new THREE.Vector4(
						data.quaternions[quaternion_id].x,
						data.quaternions[quaternion_id].y,
						data.quaternions[quaternion_id].z,
						data.quaternions[quaternion_id].w,
					);
				} else if (highlighted_panels.includes(i)) {
					panel_meshes[i].material = hilit_materials[c];
				} else {
					panel_meshes[i].material = color_materials[c];
				}
			}
		},
		set_current_rotation: function(move_id, amount) {
			if (move_id < 0) {
				for (let i = 0; i < data.panels.length; ++i) {
					panel_meshes[i].quaternion.identity();
				}
			} else {
				let move = data.moves[move_id];
				let axis = new THREE.Vector3(move.axis[0], move.axis[1], move.axis[2]);
				for (let i = 0; i < data.panels.length; ++i) {
					if (move.affected_panels[i]) {
						panel_meshes[i].quaternion.setFromAxisAngle(axis, -amount * Math.PI * 2 / move.fraction);
					} else {
						panel_meshes[i].quaternion.identity();
					}
				}
			}
		},
		get_panel: function(raycaster) {
			let result_array = raycaster.intersectObject(root, true);
			if (result_array.length == 0) {
				return -1;
			}
			for (let i = 0; i < data.panels.length; ++i) {
				if (panel_meshes[i] == result_array[0].object) {
					if (data.panels[i].color < 0) return -1;
					return i;
				}
			}
			return -1;
		},
		try_rotate: function(old_panel, new_panel) {
			if (old_panel < 0 || new_panel < 0) return -1;
			return data.move_table[old_panel][new_panel];
		},
	}
};
