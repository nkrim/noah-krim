/** 
	shader.fsh: Standard fragment shader 
	author: Noah Krim
*/

varying lowp vec4 vColor;

void main(void) {
	gl_FragColor = vColor;
}