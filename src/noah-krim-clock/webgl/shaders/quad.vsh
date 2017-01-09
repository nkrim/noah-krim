/*
	quad.vsh: Quad rendering vertex shader
	author: Noah Krim
*/

/** Vertex attributes
========================	*/
attribute vec3 position;

/** Fragment args
========================	*/
void main(void) {
	// Set position
	gl_Position = vec4(position, 1.0);
}