/** 
	shader.fsh: Standard fragment shader 
	author: Noah Krim
*/

/** Values from vertex shader
================================	*/
varying lowp    vec4  vColor;		// Color of fragment
varying mediump vec3  vNormal;		// Normal of fragment

/** Lighting uniforms
================================	*/
/** Global diffuse lighting
--------------------------------	*/
uniform mediump vec3  diffuse_dir;
uniform lowp    vec3  diffuse_col;
uniform lowp    float diffuse_int;
uniform lowp    int   diffuse_on;


/** Lighting functions
================================	*/
void diffuseLighting(	inout lowp    vec4  color, 
						      mediump vec3  norm, 
						      mediump vec3  l_dir, 
						      lowp    vec3  l_col, 
						      lowp    float l_int) {
	// C *= Li * max(0, dot(Ld, N)) * Lc
	color *= vec4(l_int * max(0.0, dot(normalize(l_dir), norm)) * l_col, 1.0);
}


/** Main function
================================	*/
void main() {
	// Normalize the vertex normal
	mediump vec3 norm = normalize(vNormal);

	// Initialize color with varying value from vertex shader
	lowp vec4 color = vColor;

	// Add diffuse lighting, if on
	if(diffuse_on > 0) {
		diffuseLighting(color, norm, diffuse_dir, diffuse_col, diffuse_int);
	}

	// Set fragment color
	gl_FragColor = color;
}
