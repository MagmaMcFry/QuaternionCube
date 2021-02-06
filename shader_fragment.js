const FRAGMENT_SHADER = `
uniform vec4 quaternion;

varying vec3 center_offset;

void main() {
    float ip = 2.0*dot(center_offset, quaternion.xyz);
    float rp = 0.5*quaternion.w + 0.5;


    gl_FragColor = vec4(rp+ip, rp-ip, rp-ip, 1);
}
`;
