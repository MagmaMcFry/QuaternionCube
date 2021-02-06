'use strict';

function gen_from_data(data) {
    let black_material = new THREE.MeshBasicMaterial({color: 0x808080});
    let color_materials = [];
    let hilit_materials = [];
    for (let i = 0; i < data.colors.length; ++i) {
        let color = data.colors[i];
        color_materials[i] = new THREE.MeshBasicMaterial({color: new THREE.Color(0.8*color[0], 0.8*color[1], 0.8*color[2])});
        hilit_materials[i] = new THREE.MeshBasicMaterial({color: new THREE.Color(color[0], color[1], color[2])});
    }
    let panel_meshes = [];
    let panel_transforms = [];
    let root = new THREE.Object3D();
    root.scale.x = 1/data.size;
    root.scale.y = 1/data.size;
    root.scale.z = 1/data.size;

    for (let i = 0; i < data.panels.length; ++i) {
        let panel = data.panels[i];
        let box = panel.box;
        let geometry = new THREE.BoxGeometry(
            box[0][1] - box[0][0],
            box[1][1] - box[1][0],
            box[2][1] - box[2][0],
        );
        let mesh = new THREE.Mesh(geometry, black_material);
        mesh.position.x = (box[0][1] + box[0][0])/2;
        mesh.position.y = (box[1][1] + box[1][0])/2;
        mesh.position.z = (box[2][1] + box[2][0])/2;
        let transform = new THREE.Object3D();
        transform.add(mesh);
        root.add(transform);
        panel_meshes[i] = mesh;
        panel_transforms[i] = transform;
    }

    let panel_colors = [];
    for (let i = 0; i < data.panels.length; ++i) {
        panel_colors[i] = data.panels[i].color;
        console.log(panel_colors[i]);
    }

    return {
        get_move_count: function() { return data.moves.length; },
		get_root: function() { return root; },
		apply_move: function(move_id) {
            let perm = data.moves[move_id].panel_perm;
            let old_panel_colors = panel_colors.slice();
            for (let i = 0; i < data.panels.length; ++i) {
                panel_colors[perm[i]] = old_panel_colors[i];
            }
        },
		update_panels: function(...highlighted_panels) {
            for (let i = 0; i < data.panels.length; ++i) {
                let c = panel_colors[i];
                if (c < 0) {
                    // Stay gray
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
                    panel_transforms[i].quaternion.identity();
                }
            } else {
                let move = data.moves[move_id];
                //console.log(move.axis);
                //console.log(move.fraction);
                //console.log(amount);
                let axis = new THREE.Vector3(move.axis[0], move.axis[1], move.axis[2]);
                for (let i = 0; i < data.panels.length; ++i) {
                    if (move.affected_panels[i]) {
                        panel_transforms[i].quaternion.setFromAxisAngle(axis, -amount * Math.PI * 2 / move.fraction);
                    } else {
                        panel_transforms[i].quaternion.identity();
                    }
                }
            }
        },
		get_panel: function(raycaster) {
            let result_array = raycaster.intersectObject(root, true);
            if (result_array.length == 0) {
                //console.log("No intersections found");
                return -1;
            }
            for (let i = 0; i < data.panels.length; ++i) {
                if (panel_meshes[i] == result_array[0].object) {
                    if (data.panels[i].color < 0) return -1;
                    return i;
                }
            }
            //console.log("Invalid intersection found");
            return -1;
        },
		try_rotate: function(old_panel, new_panel) {
            if (old_panel < 0 || new_panel < 0) return -1;
            return data.move_table[old_panel][new_panel];
        },
    }
};
