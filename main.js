'use strict';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10);
camera.position.z = 3;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// const geometry = new THREE.BoxGeometry();
// const material = new THREE.MeshBasicMaterial({color: 0xff0000});
// const cubemesh = new THREE.Mesh(geometry, material);
// scene.add(cubemesh);

const cube = rubikscube(3);
const cubemodel = cube.R_get_root();
scene.add(cubemodel);

var current_amount = 0;
var current_rotation = 0;
function update_cube() {
	current_amount += 0.02;
	if (current_amount >= 1) {
		cube.apply_move(current_rotation);
		cube.R_update_plates();
		current_amount = 0;
		current_rotation = Math.floor(Math.random() * cube.get_move_count());
	}
	cube.R_set_current_rotation(current_rotation, current_amount);
}

function animate() {
	requestAnimationFrame(animate);
	cubemodel.rotation.x += 0.01;
	cubemodel.rotation.z += 0.01;
	update_cube();
	renderer.render(scene, camera);
}
requestAnimationFrame(animate);
