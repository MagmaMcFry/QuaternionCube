'use strict';

let scramble = function() {};
let reset = function() {};
let toggle_quaternions = function() {};
let toggle_animations = function() {};

window.addEventListener("load", function() {
	const canvas = document.getElementById("canvas");
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 10);
	camera.position.z = 5;
	const camera_rotation = new THREE.Object3D();
	camera_rotation.add(camera);
	scene.add(camera_rotation);
	const renderer = new THREE.WebGLRenderer();
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	canvas.appendChild(renderer.domElement);

	var cube = gen_puzzle_from_data(CUBE_3_DATA);
	var cubemodel = cube.get_root();
	scene.add(cubemodel);

	let move_progress = 0;
	let current_move = 0;
	let show_animations = true;
	let show_quaternions = true;

	function apply_move(move) {
		move_progress = show_animations ? -1 : 0;
		current_move = move;
		cube.apply_move(current_move);
	};

	scramble = function() {
		for (let i = 0; i < 100; ++i) {
			let move_id = Math.floor(Math.random() * cube.get_move_count());
			cube.apply_move(move_id);
			move_progress = 0;
		}
	};

	reset = function() {
		cube.reset();
		move_progress = 0;
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

	function update_cube() {
		move_progress += 0.05;
		if (move_progress > 0) {
			move_progress = 0;
		}

		cube.update(current_move, move_progress, [moused_panel, clicked_panel]);
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
			camera_rotation.quaternion.multiply(rotation);
		}
	});

	window.addEventListener("resize", function() {
		console.log("Resized");
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
				apply_move(move);
			}
		}
		mouse_down = false;
		clicked_panel = -1;
	});

	document.addEventListener("keypress", function(e) {
		console.log("Code: " + e.code);
		if (e.code === "Space") {
			scramble();
		} else if (e.code === "KeyR") {
			reset();
		} else if (e.code === "KeyQ") {
			toggle_quaternions();
		} else if (e.code === "KeyA") {
			toggle_animations();
		}
	});

	function animate() {
		requestAnimationFrame(animate);
		moused_panel = getMousedPanel();
		update_cube();
		renderer.render(scene, camera);
	};

	requestAnimationFrame(animate);

});
