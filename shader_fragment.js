const FRAGMENT_SHADER = `
uniform vec4 quaternion;

uniform float highlight;

varying vec3 center_offset;

float stripes(float x, float w) {
    return sign(x-w) + sign(x) + sign(x+w);
}
void main() {
    float ql = length(quaternion.xyz);
    vec3 qv = normalize(quaternion.xyz);
    float ip = 0.2 * stripes(dot(center_offset, qv), 0.2) * ql * ql;
    // float ip = 2.0 * dot(center_offset, quaternion.xyz);
    float rp = pow(0.3*quaternion.w + 0.6, 1.5);
    gl_FragColor = vec4(rp+ip, rp, rp-ip, 1) * (0.8 + 0.1 * highlight) + 0.1 * highlight;
}
`;
