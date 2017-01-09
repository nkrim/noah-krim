/*
	sat.fsh: Summed-area table fragment shader 
	author: Noah Krim
*/

precision mediump float;
precision mediump int;

/** Texture uniforms
================================	*/
uniform sampler2D	img_tex;

void main(void) {
	// DEFAULTS
	const int resolution = 512;
	const int sections = 8;

	// Get default-based values
	const int sectionSize = resolution / sections;
	const float pixelSize = 1.0 / float(resolution);

	// Locate section
	int sectionIndex = int(gl_FragCoord.x / float(sectionSize));
	int sectionStart = sectionIndex * sectionSize;

	// Calculate row sum
	vec4 sum = vec4(0.0,0.0,0.0,0.0);
	for(int i = 0; i < sectionSize; i++) {
		float texelX = gl_FragCoord.x - float(i);
		if(int(texelX) >= sectionStart) {
			vec2 coord = vec2(texelX, gl_FragCoord.y) * pixelSize;
			sum += texture2D(img_tex, coord);
		}
	}

	// Offset based on resolution and section
	sum *= pixelSize * float(sections);

	// Return blended color
	gl_FragColor = vec4(sum.xyz, 1.0);
}