/** 
	draw.fsh: Drawing fragment shader 
	author: Noah Krim
*/

precision mediump float;
precision lowp int;

/** Values from vertex shader
================================	*/
varying vec4  	vColor;			// Color of fragment
varying vec3  	vNormal;		// Normal of fragment
varying vec3 	vViewDir;		// Direction to view from fragment
varying vec3 	vVsmLightCoords;
varying float 	vVsmFragDepth;

/** Texture uniforms
================================	*/
uniform sampler2D vsm_tex;

/** Lighting uniforms
================================	*/
/** Overall lighting flag
--------------------------------	*/
uniform int  	lighting_on;
/** Global ambient lighting
--------------------------------	*/
uniform vec3  	ambient_col;
uniform float 	ambient_int;
uniform int 	ambient_on;
/** Diffuse lighting
--------------------------------	*/
uniform vec3  	diffuse_dir;
uniform vec3  	diffuse_col;
uniform float 	diffuse_int;
uniform int   	diffuse_on;
/** Specular lighting
--------------------------------	*/
uniform	vec3 	specular_col;
uniform float	specular_int;
uniform float 	specular_exp;
uniform int 	specular_on;
/** VSM lighting
--------------------------------	*/
uniform int 	vsm_on;


/** Helper functions
================================	*/
float linstep(float low, float high, float v) {
	return clamp((v-low)/(high-low), 0.0, 1.0);
}

/** Lighting functions
================================	*/
float diffuseLighting(	vec3  	norm, 
					    vec3  	l_dir, 
					    float 	l_int) {
	return l_int * max(0.0, dot(l_dir, norm));
}
float specularLighting(	vec3	norm,
						float	exp,
						vec3 	v_dir,
						vec3	l_dir,
						float	l_int) {
	vec3 halfDir = normalize(v_dir + l_dir);
	return l_int * pow(max(0.0, dot(norm, halfDir)), exp);

	//mediump vec3 l_ref = normalize(reflect(-1.0*l_dir, norm));
	//return l_int * pow(max(0.0, dot(normalize(vViewDir), l_ref)), exp);
}
float vsmLighting(	sampler2D 	map_tex,
					vec2		tex_coords,
					float		frag_depth) {
	vec2 moments = texture2D(map_tex, tex_coords).xy;

	/*float variance = moments.y - moments.x*moments.x;
	float mD = frag_depth - moments.x;
	float p = variance / (variance + mD * mD);
	return min(1.0, max(p, float(frag_depth <= moments.x)));*/

	float p = smoothstep(frag_depth-0.02, frag_depth, moments.x);
	float variance = max(moments.y - moments.x*moments.x, -0.001);
	float d = frag_depth - moments.x;
	float p_max = linstep(0.2, 1.0, variance / (variance + d*d));
	return clamp(max(p, p_max), 0.0, 1.0);
}

/** Main function
================================	*/
void main(void) {
	// Normalize the vertex normal
	vec3 norm = normalize(vNormal);
	// Initialize color with varying value from vertex shader
	vec3 color = vColor.xyz;
	// Get normalized vector for diffuse lighting
	vec3 diffuse_dir_norm_rev = -1.0 * normalize(diffuse_dir);

	// Lighting
	if(lighting_on > 0) {
		// Set defualts
		float amb = 0.0;
		float dif = 0.0;
		float spec = 0.0;
		float vsmLit = 1.0;

		// Ambient lighting
		if(ambient_on > 0)
			amb = ambient_int;

		// Diffuse lighting
		if(diffuse_on > 0)
			dif = diffuseLighting(norm, diffuse_dir_norm_rev, diffuse_int);

		// Specular lighting
		if(specular_on > 0 && specular_exp > 0.0)
			spec = specularLighting(norm, specular_exp, vViewDir, diffuse_dir_norm_rev, specular_int);
		
		// VSM lighting
		if(vsm_on > 0)
			vsmLit = vsmLighting(vsm_tex, vVsmLightCoords.xy, vVsmLightCoords.z);

		// Set fragment color
		/*gl_FragColor = vec4(clamp(
			color * (
				amb * ambient_col + 
				vsmLit * dif * diffuse_col + 
				4.0*clamp(dif, 0.0, 0.25) * spec * specular_col
			)
		, 0.0, 1.0), vColor.w);*/
		gl_FragColor = vec4(vsmLit, texture2D(vsm_tex, vVsmLightCoords.xy).x, vVsmLightCoords.z, 1.0);
	}
	else {
		// Set fragment color
		gl_FragColor = vColor;
	}
}
