precision highp float;

attribute vec3 position;
uniform mat4 worldViewProjection;
varying vec3 vPosition;
varying vec2 vUV;


void main(void) {
		#define SHADOWDEPTH_NORMALBIAS

		gl_Position = worldViewProjection * vec4(position, 1.0);
		vPosition = position;
}
