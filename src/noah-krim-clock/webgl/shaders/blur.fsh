/*
	blur.fsh: Gaussian blur fragment shader 
	author: Noah Krim
*/

precision mediump float;
precision lowp int;

/** Values from vertex shader
================================	*/
varying vec2 	vTexCoords;	// Texture coords for img_tex

/** Kernal uniforms
================================	*/
uniform mediump int resolution;
uniform float		blur_sigma;
uniform int			is_vertical;
uniform sampler2D	img_tex;

mediump float gauss(float dist, float sigma) {
	return 0.39894 * exp(-0.5*dist*dist / (sigma*sigma)) / sigma;
}

void main(void) {
	// Constants
	const int kernal_size = 5;

	// Create kernal
	const int arr_size = 2 * kernal_size + 1;
	float kernal[arr_size];
	for(int i=0; i <= kernal_size; i++) {
		kernal[kernal_size+i] = kernal[kernal_size-i] = gauss(float(i), blur_sigma);
	}

	// Get normalizaiton factor of kernal
	float Z = 0.0;
	for(int i=0; i < arr_size; i++) {
		Z += kernal[i];
	}

	// Set up pixel increments in order to apply kernal
	float pixel_size = 1.0/float(resolution);
	vec2 pixel_inc = is_vertical > 0 ? vec2(0.0, pixel_size) : vec2(pixel_size, 0.0);

	// Reduce kernal to blurred color from image
	vec4 blended_color = vec4(0.0);
	for(int i=-kernal_size; i <= kernal_size; i++) {
		blended_color += kernal[kernal_size+i] * texture2D(img_tex, vTexCoords + float(i) * pixel_inc);
	}
	blended_color /= Z;

	// Return blended color
	gl_FragColor = blended_color;
}