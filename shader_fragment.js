const FRAGMENT_SHADER = `
uniform vec4 quaternion;

varying vec3 center_offset;

void main() {
    float ip = 0.6 * sign(dot(center_offset, quaternion.xyz)) * dot(quaternion.xyz, quaternion.xyz);
    // float ip = 2.0 * dot(center_offset, quaternion.xyz);
    float rp = pow(0.3*quaternion.w + 0.6, 1.5);

    gl_FragColor = vec4(rp+ip, rp, rp-ip, 1);
}
`;
