/*
	copy.vsh: Texture copy vertex shader 
	author: Noah Krim
*/

/** Vertex attributes
========================	*/
attribute vec3 position;

/** Fragment args
========================	*/
varying vec2 vTexCoords;

void main(void) {
	// Init bias matrix
	mat4 biasMatrix = mat4(	0.5,0.0,0.0,0.0,
							0.0,0.5,0.0,0.0,
							0.0,0.0,0.5,0.0,
							0.5,0.5,0.5,1.0);

	// Set position
	gl_Position = vec4(position, 1.0);

	// Set fragment shader arguments
	vTexCoords = (biasMatrix * vec4(position, 1.0)).xy;
}