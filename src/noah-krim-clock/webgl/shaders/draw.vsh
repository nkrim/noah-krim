/*
	draw.vsh: Drawing vertex shader 
	author: Noah Krim
*/

/** Vertex attributes
========================	*/
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;

/** Scene uniforms
========================	*/
/** Projection/View
------------------------	*/
uniform mat4 projection;
uniform mat4 modelView;
uniform mat4 lightProj;
uniform mat4 lightView;
/** Transforms
------------------------	*/
uniform mat4 objWorld;
uniform mat4 base;
uniform mat4 scale;
uniform mat4 rotation;
uniform mat4 translation;
/** Camera
------------------------	*/
uniform vec3 camPos;

/** Fragment args
========================	*/
varying vec4 	vColor;
varying vec3 	vNormal;
varying vec3 	vViewDir;
varying vec3 	vVsmLightCoords;
varying float	vVsmFragDepth;

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
	vec3 norm = (world * vec4(normal, 0.0)).xyz;
	vec4 lightCoords = lightProj * lightView * worldPos;

	// Set position
	gl_Position = pos;

	// Set fragment shader arguments
	vColor = color;
	vNormal = norm;
	vViewDir = camPos - worldPos.xyz;
	vVsmLightCoords = (biasMatrix * (lightCoords/lightCoords.w)).xyz;
	vVsmFragDepth = distance(pos.xyz, camPos)*distance(vec3(0.0,0.0,0.0), camPos)/40.0;
}