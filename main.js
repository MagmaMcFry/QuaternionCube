'use strict';

window.addEventListener("load", function() {
	const canvas = document.getElementById("canvas");
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 10);
	camera.position.z = 3;
	const renderer = new THREE.WebGLRenderer();
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	canvas.appendChild(renderer.domElement);

	// const geometry = new THREE.BoxGeometry();
	// const material = new THREE.MeshBasicMaterial({color: 0xff0000});
	// const cubemesh = new THREE.Mesh(geometry, material);
	// scene.add(cubemesh);

	var cube = rubikscube(2);
	var cubemodel = cube.get_root();
	scene.add(cubemodel);

	let current_amount = 0;
	let current_move = 0;

	function apply_move(move) {
		current_amount = -1;
			current_move = move;
			cube.apply_move(current_move);
	};

	function update_cube() {
		current_amount += 0.1;
		if (current_amount > 0) {
			current_amount = 0;
		}

	//	if (current_amount == 0) {
	//		apply_move(Math.floor(Math.random() * cube.get_move_count()));
	//	}

		cube.set_current_rotation(current_move, current_amount);
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
			let target = new THREE.Quaternion(-100*dmouse.y, 100*dmouse.x, 0, 1).normalize();
			let rotation = new THREE.Quaternion();
			rotation.rotateTowards(target, 2*dmouse.length());
			cubemodel.quaternion.multiplyQuaternions(rotation, cubemodel.quaternion);
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
		//console.log("Clicked panel", clicked_panel);
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
		if (e.code === "NumpadSubtract") {

		}
	});

	//renderer.domElement.addEventListener("click", function() {
	//	apply_move(Math.floor(Math.random() * cube.get_move_count()));
	//});

	function animate() {
		requestAnimationFrame(animate);
		//let target = new THREE.Quaternion(0.5, 0.5, 0.5, 0.5);
		//let rotation = new THREE.Quaternion().rotateTowards(target, 0.01);
		//cubemodel.quaternion.multiply(rotation);
		update_cube();
		moused_panel = getMousedPanel();
		cube.update_panels(moused_panel, clicked_panel);
		renderer.render(scene, camera);
	};

	requestAnimationFrame(animate);

});
