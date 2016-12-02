/*
	shader.vsh: Standard vertex shader 
	author: Noah Krim
*/

/** Vertex attributes
========================	*/
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;

/** Scene uniforms
========================	*/
/** Transforms
------------------------	*/
uniform mat4 projection;
uniform mat4 modelView;
uniform vec3 world;
/** Camera
------------------------	*/
uniform vec3 camPos;

/** Fragment args
========================	*/
varying lowp vec4 vColor;
varying lowp vec3 vNormal;

void main(void) {
	// Transform vertex and normal
	vec4 pos = projection * modelView * vec4((camPos - world * position), 1.0);
	vec3 norm = world * normal;

	// Set position
	gl_Position = pos;

	// Set fragment shader arguments
	vColor = color;
	vNormal = norm;
}