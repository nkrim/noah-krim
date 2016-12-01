/** 
	shader.fsh: Standard fragment shader 
	author: Noah Krim
*/

/** Values from vertex shader
================================	*/
varying lowp vec4 vColor;		// Color of fragment
varying lowp vec3 vNormal;		// Normal of fragment

/** Lighting uniforms
================================	*/
/** Global diffuse lighting
--------------------------------	*/
uniform vec3 diffuse_dir;
uniform vec3 diffuse_col;
uniform float diffuse_int;

void main() {
	// Normalize the vertex normal
	vec3 norm = normalize(vNormal);

	// Initialize color with varying value from vertex shader
	vec4 color = vColor;

	// Add diffuse lighting
	diffuseLighting(color, norm, diffuse_dir, diffuse_col, diffuse_int)

	// Set fragment color
	gl_FragColor = color;
}

/** Lighting functions
================================	*/
void diffuseLighting(inout vec4 color, vec3 norm, vec3 l_dir, vec3 l_col, float l_int) {
	// C *= Li * max(0, dot(Ld, N)) * Lc
	color *= vec4(l_int * max(0, dot(l_dir, norm)) * l_col, 1.0);
}