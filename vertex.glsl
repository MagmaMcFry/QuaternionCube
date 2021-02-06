uniform vec3 cubie_center;

varying vec3 center_offset;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    center_offset = vec3(0.0, 0.0, 0.0); /* (modelMatrix * vec4(position - cubie_center, 0.0)).xyz; */
}
