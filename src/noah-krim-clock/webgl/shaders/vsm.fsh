/*
	vsm.fsh: Variance shadow map fragment shader 
	author: Noah Krim
*/

#extension GL_OES_standard_derivatives : enable

precision mediump float;
precision lowp int;

varying float vFragDepth;

void main(void) {
	float moment1 = vFragDepth;
	float moment2 = vFragDepth * vFragDepth;

	float dx = dFdx(vFragDepth);
	float dy = dFdy(vFragDepth);

	moment2 += 0.25*(dx*dx+dy*dy);

	// Set color with x and y as depth and depth*depth
	gl_FragColor = vec4(moment1, moment2, 0.0, 1.0);
}