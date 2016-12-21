/*
	blur.fsh: Texture copy fragment shader 
	author: Noah Krim
*/

precision mediump float;
precision lowp int;

/** Values from vertex shader
================================	*/
varying vec2 vTexCoords;	// Texture coords for img_tex

/** Kernal uniforms
================================	*/
uniform sampler2D	img_tex;

void main(void) {
	// Return blended color
	gl_FragColor = texture2D(img_tex, vTexCoords);
}