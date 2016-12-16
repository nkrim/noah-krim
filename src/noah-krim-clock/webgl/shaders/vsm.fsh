/*
	vsm.fsh: Variance shadow map fragment shader 
	author: Noah Krim
*/

void main(void) {
	// Get fragment depth
	mediump float depth = gl_FragCoord.z;

	// Set color with x and y as depth and depth*depth
	gl_FragColor = vec4(depth, depth*depth, 0.0, 1.0);
}