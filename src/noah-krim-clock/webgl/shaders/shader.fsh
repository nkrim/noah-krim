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
/** Overall lighting flag
--------------------------------	*/
uniform lowp    int  lighting_on;
/** Global ambient lighting
--------------------------------	*/
uniform mediump vec3  ambient_col;
uniform lowp    float ambient_int;
uniform lowp    int   ambient_on;
/** Global diffuse lighting
--------------------------------	*/
uniform mediump vec3  diffuse_dir;
uniform lowp    vec3  diffuse_col;
uniform mediump float diffuse_int;
uniform lowp    int   diffuse_on;


/** Lighting functions
================================	*/
lowp vec3 ambientLighting(  lowp    vec3  color,
							mediump vec3  l_col,
							lowp    float l_int) {
	// Ca = Cv * Li * Lc
	return color.xyz * l_int * l_col;
}
lowp vec3 diffuseLighting(	lowp    vec3  color, 
				      		mediump vec3  norm, 
				      		mediump vec3  l_dir, 
				      		lowp    vec3  l_col, 
				      		mediump    float l_int) {
	// Cd = Cv * Li * max(0, dot(Ld, N)) * Lc
	return color * l_int * max(0.0, dot(-1.0 * normalize(l_dir), norm)) * l_col;
}


/** Main function
================================	*/
void main() {
	// Normalize the vertex normal
	mediump vec3 norm = normalize(vNormal);

	// Initialize color with varying value from vertex shader
	lowp vec3 color = vColor.xyz;

	// Lighting
	// Ambient lighting
	lowp vec3 amb;
	if(ambient_on > 0) {
		amb = ambientLighting(color, ambient_col, ambient_int);
	}

	// Diffuse lighting
	lowp vec3 dif;
	if(diffuse_on > 0) {
		dif = diffuseLighting(color, norm, diffuse_dir, diffuse_col, diffuse_int);
	}

	// Set fragment color
	if(lighting_on > 0) {
		gl_FragColor = vec4(clamp(amb + dif, 0.0, 1.0), vColor.w);
	}
	else {
		gl_FragColor = vColor;
	}
}
