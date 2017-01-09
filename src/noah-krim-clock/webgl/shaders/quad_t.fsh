/*
	quad_t.fsh: Quad rendering fragment shader w/ texture coords
	author: Noah Krim
*/

precision mediump float;
precision lowp int;

/** Values from vertex shader
================================	*/
varying vec2 	vTexCoords;	// Texture coords for img_tex

/** Texture uniforms
================================	*/
uniform sampler2D	img_tex;

void main(void) {
	gl_FragColor = texture2D(img_tex, vTexCoords);
}