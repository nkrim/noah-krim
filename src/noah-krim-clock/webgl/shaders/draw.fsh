/** 
	draw.fsh: Drawing fragment shader 
	author: Noah Krim
*/

/** Values from vertex shader
================================	*/
varying lowp    vec4  	vColor;			// Color of fragment
varying mediump vec3  	vNormal;		// Normal of fragment
varying mediump vec3 	vViewDir;		// Direction to view from fragment
varying mediump vec2 	vVsmTexCoords;	// Texture coords for vsm_tex

/** Texture uniforms
================================	*/
uniform sampler2D vsm_tex;

/** Lighting uniforms
================================	*/
/** Overall lighting flag
--------------------------------	*/
uniform lowp    int  lighting_on;
/** Global ambient lighting
--------------------------------	*/
uniform mediump vec3  	ambient_col;
uniform lowp    float 	ambient_int;
uniform lowp    int   	ambient_on;
/** Diffuse lighting
--------------------------------	*/
uniform mediump vec3  	diffuse_dir;
uniform lowp    vec3  	diffuse_col;
uniform mediump float 	diffuse_int;
uniform lowp    int   	diffuse_on;
/** Specular lighting
--------------------------------	*/
uniform lowp 	vec3 	specular_col;
uniform mediump	float	specular_int;
uniform mediump float 	specular_exp;
uniform lowp	int 	specular_on;


/** Lighting functions
================================	*/
mediump vec3 ambientLighting(  mediump vec3  l_col,
								lowp    float l_int) {
	return l_int * l_col;
}
mediump	vec3 diffuseLighting(	mediump vec3  	norm, 
					      		mediump vec3  	l_dir, 
					      		lowp    vec3  	l_col, 
					      		mediump	float 	l_int) {
	return l_int * max(0.0, dot(l_dir, norm)) * l_col;
}
mediump	vec3 specularLighting(	mediump	vec3	norm,
								mediump float	exp,
								mediump vec3 	v_dir,
								mediump vec3	l_dir,
								lowp 	vec3 	l_col,
								mediump float	l_int) {
	mediump vec3 halfDir = normalize(v_dir + l_dir);
	return l_int * pow(max(0.0, dot(norm, halfDir)), exp) * l_col;
}


/** Main function
================================	*/
void main(void) {
	// Normalize the vertex normal
	mediump vec3 norm = normalize(vNormal);
	// Initialize color with varying value from vertex shader
	lowp vec3 color = vColor.xyz;
	// Get normalized vector for diffuse lighting
	mediump vec3 diffuse_dir_norm_rev = -1.0 * normalize(diffuse_dir);

	// Lighting
	if(lighting_on > 0) {
		/*// Ambient lighting
		mediump vec3 amb = vec3(0.0,0.0,0.0);
		if(ambient_on > 0)
			amb = ambientLighting(ambient_col, ambient_int);

		// Diffuse lighting
		mediump vec3 dif = vec3(0.0,0.0,0.0);
		if(diffuse_on > 0)
			dif = diffuseLighting(norm, diffuse_dir_norm_rev, diffuse_col, diffuse_int);

		// Specular lighting
		mediump vec3 spec = vec3(0.0,0.0,0.0);
		if(specular_on > 0 && specular_exp > 0.0)
			spec = specularLighting(norm, specular_exp, vViewDir, diffuse_dir_norm_rev, specular_col, specular_int);

		// VSM lighting
		mediump vec4 moments = texture2D(vsm_tex, vVsmTexCoords);

		// Set fragment color
		gl_FragColor = moments;//vec4(clamp(color * (amb + dif + spec), 0.0, 1.0), vColor.w);*/
	}
	else {
		// Set fragment color
		gl_FragColor = vColor;
	}
}
