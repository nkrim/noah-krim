/*
	shader.vsh: Standard vertex shader 
	author: Noah Krim
*/

attribute vec3 position;
attribute vec4 color;

uniform mat4 perspective;
uniform mat4 modelView;
uniform mat4 world;

varying lowp vec4 vColor;

void main(void) {
	gl_Position = perspective * modelView * world * vec4(position, 1.0);
	vColor = color;
}