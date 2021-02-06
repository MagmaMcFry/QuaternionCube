varying vec3 center_offset;

void main() {
    dist = dot(center_offset, center_offset);

    gl_FragColor = vec4(dist, dist, dist, 1.0);
}
