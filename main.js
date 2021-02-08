'use strict';

let scramble = function() {};
let reset = function() {};
let toggle_quaternions = function() {};
let toggle_animations = function() {};
let toggle_relative = function() {};
let undo = function() {};
let redo = function() {};
let save = function() {};
let load = function() {};

window.addEventListener("load", function() {
	const canvas = document.getElementById("canvas");
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(30, canvas.clientWidth / canvas.clientHeight, 0.1, 20);
	camera.position.z = 8;
	camera.position.x = -0.4;
	const camera_rotation = new THREE.Object3D();
	camera_rotation.quaternion.copy(new THREE.Quaternion(-0.14, -0.2, -0.02, 1).normalize());
	camera_rotation.add(camera);
	scene.add(camera_rotation);
	const renderer = new THREE.WebGLRenderer();
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	canvas.appendChild(renderer.domElement);

	var cube = gen_puzzle_from_data(CUBE_DATA);
	var cubemodel = cube.get_root();
	scene.add(cubemodel);

	let move_progress = 0;
	let current_move = 0;
	let show_animations = true;
	let show_quaternions = true;
	let show_relative = false;
	let undo_history = [];
	let redo_history = [];
	let initial_history = [];

	function apply_move(move) {
		move_progress = show_animations ? -1 : 0;
		current_move = move;
		cube.apply_move(current_move);
	};

	function do_move(move) {
		undo_history.push(move);
		redo_history = [];
		apply_move(move);
	};

	undo = function() {
		if (undo_history.length == 0) {
			return;
		}
		let last_move = undo_history.pop();
		redo_history.push(last_move);
		apply_move(cube.opposite_move(last_move));
	};

	redo = function() {
		if (redo_history.length == 0) {
			return;
		}
		let next_move = redo_history.pop();
		undo_history.push(next_move);
		apply_move(next_move);
	};

	save = function() {
		let history_object = {
			initial_history: initial_history,
			undo_history: undo_history,
		};
		window.location.hash = JSON.stringify(history_object);
	};

	load = function() {
		let history_object = {};
		let initial_history_new = [];
		let undo_history_new = [];
		try {
			history_object = JSON.parse(decodeURIComponent(window.location.hash.substring(1)));
			initial_history_new = history_object["initial_history"];
			for (let i = 0; i < initial_history_new.length; ++i) { initial_history_new[i] = parseInt(initial_history_new[i]); }
			undo_history_new = history_object["undo_history"];
			for (let i = 0; i < undo_history_new.length; ++i) { undo_history_new[i] = parseInt(undo_history_new[i]); }
		} catch (error) { console.log(error); return; }
		reset();
		initial_history = initial_history_new;
		for (let i = 0; i < initial_history.length; ++i) {
			cube.apply_move(initial_history[i]);
			move_progress = 0;
		}
		for (let i = 0; i < undo_history_new.length; ++i) {
			do_move(undo_history_new[i]);
		}
	}

	scramble = function() {
		for (let i = 0; i < 100; ++i) {
			let move_id = Math.floor(Math.random() * cube.get_move_count());
			cube.apply_move(move_id);
			move_progress = 0;
			undo_history = [];
			redo_history = [];
			initial_history.push(move_id);
		}
	};

	reset = function() {
		cube.reset();
		move_progress = 0;
		camera_rotation.quaternion.copy(new THREE.Quaternion(-0.14, -0.2, -0.02, 1).normalize());
		undo_history = [];
		redo_history = [];
		initial_history = [];
	};

	toggle_quaternions = function() {
		show_quaternions = !show_quaternions;
		cube.set_show_quaternions(show_quaternions);
		if (show_quaternions) {
			document.getElementById("toggle_quaternions").classList.remove("disabled");
		} else {
			document.getElementById("toggle_quaternions").classList.add("disabled");
		}
	};

	toggle_animations = function() {
		show_animations = !show_animations;
		if (show_animations) {
			document.getElementById("toggle_animations").classList.remove("disabled");
		} else {
			document.getElementById("toggle_animations").classList.add("disabled");
		}
	};

	toggle_relative = function() {
		show_relative = !show_relative;
		if (show_relative) {
			document.getElementById("toggle_relative").classList.remove("disabled");
		} else {
			document.getElementById("toggle_relative").classList.add("disabled");
		}
	};

	function update_cube() {
		move_progress += 0.05;
		if (move_progress > 0) {
			move_progress = 0;
		}
		let camera_quaternion = new THREE.Quaternion();
		if (show_relative) {
			camera_quaternion.multiply(camera_rotation.quaternion);
		}
		cube.update(current_move, move_progress, [moused_panel, clicked_panel], camera_quaternion);
	};

	let mouse_down = false;
	let moused_panel = -1;
	let clicked_panel = -1;
	let mouse = new THREE.Vector2();
	let raycaster = new THREE.Raycaster();

	function getMousedPanel() {
		raycaster.setFromCamera(mouse, camera);
		return cube.get_panel(raycaster);
	};


	renderer.domElement.addEventListener("mousemove", function(event) {
		event.preventDefault();
		let oldmouse = mouse.clone();
		mouse.x = ( event.clientX / canvas.clientWidth ) * 2 - 1;
		mouse.y = 1 - 2 * ( event.clientY / canvas.clientHeight );

		if (mouse_down && clicked_panel == -1) {
			let dmouse = mouse.clone().sub(oldmouse);
			dmouse.x *= canvas.clientWidth / canvas.clientHeight;
			let target = new THREE.Quaternion(100*dmouse.y, -100*dmouse.x, 0, 1).normalize();
			let rotation = new THREE.Quaternion();
			rotation.rotateTowards(target, 2*dmouse.length());
			camera_rotation.quaternion.multiply(rotation).normalize();
		}
	});

	window.addEventListener("resize", function() {
		camera.aspect = canvas.clientWidth / canvas.clientHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( canvas.clientWidth, canvas.clientHeight );
	});

	renderer.domElement.addEventListener("mousedown", function() {
		mouse_down = true;
		clicked_panel = getMousedPanel();
	});

	renderer.domElement.addEventListener("mouseup", function() {
		if (clicked_panel != -1 && moused_panel != -1) {
			let move = cube.try_rotate(clicked_panel, moused_panel);
			if (move != -1) {
				do_move(move);
			}
		}
		mouse_down = false;
		clicked_panel = -1;
	});

	document.addEventListener("keypress", function(e) {
		//console.log("Code: " + e.code);
		if (e.code === "Space") {
			scramble();
		} else if (e.code === "KeyR") {
			reset();
		} else if (e.code === "KeyQ") {
			toggle_quaternions();
		} else if (e.code === "KeyA") {
			toggle_animations();
		} else if (e.code === "KeyC") {
			toggle_relative();
		} else if (e.code === "KeyS") {
			save();
		} else if (e.code === "KeyL") {
			load();
		}
	});

	document.addEventListener("keydown", function(e) {
		//console.log("Key: " + e.key);
		if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
			if (e.shiftKey) {
				redo();
			} else {
				undo();
			}
		}
	});

	function animate() {
		requestAnimationFrame(animate);
		moused_panel = getMousedPanel();
		update_cube();
		renderer.render(scene, camera);
	};

	requestAnimationFrame(animate);

	document.getElementById("loading").remove();
});
