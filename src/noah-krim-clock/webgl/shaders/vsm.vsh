/*
	vsm.vsh: Variance shadow map vertex shader 
	author: Noah Krim
*/

/** Vertex attributes
========================	*/
attribute vec3 position;

/** Scene uniforms
========================	*/
/** Transforms
------------------------	*/
uniform mat4 projection;
uniform mat4 modelView;
uniform mat4 objWorld;
uniform mat4 base;
uniform mat4 scale;
uniform mat4 rotation;
uniform mat4 translation;

/** Fragment args
========================	*/
varying float vFragDepth;

void main(void) {
	// Init bias matrix
	mat4 biasMatrix = mat4(	0.5,0.0,0.0,0.0,
							0.0,0.5,0.0,0.0,
							0.0,0.0,0.5,0.0,
							0.5,0.5,0.5,1.0);

	// Transform vertex and normal
	mat4 world = objWorld * translation * rotation * scale * base;
	vec4 worldPos = world * vec4(position, 1.0);
	vec4 pos = projection * modelView * worldPos;

	// Set position
	gl_Position = pos;

	float bias = 0.0;
	vFragDepth = (biasMatrix * (pos/pos.w)).z + bias;
}