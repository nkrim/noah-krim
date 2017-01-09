/*
	sat_m.fsh: Summed-area table merging fragment shader 
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
	vec2 fragCoordFlipped = vec2(gl_FragCoord.y, gl_FragCoord.x);
	int sectionIndex = int(fragCoordFlipped.x / float(sectionSize));

	// Calculate combined sum
	vec2 texCoords = fragCoordFlipped * pixelSize;
	vec4 sum = texture2D(img_tex, texCoords);
	for(int i = 0; i < sections; i++) {
		if(i < sectionIndex) {
			float sectionEndX = (float((i+1) * sectionSize) - 0.5) * pixelSize;
			sum += texture2D(img_tex, vec2(sectionEndX, texCoords.y));
		}
	}

	// Offset based on resolution and section
	sum /= float(sections);

	// Return blended color
	gl_FragColor = vec4(sum.xyz, 1.0);
}