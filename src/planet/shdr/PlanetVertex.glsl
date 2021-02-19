precision highp float;

attribute vec3 position;
uniform mat4 worldViewProjection;

varying vec3 vPosition;
varying vec3 vRayDir;
varying vec2 vUV;


void main(void) {
		#define SHADOWDEPTH_NORMALBIAS

		/* gl_Position = worldViewProjection * vec4(position, 1.0);
		vPosition = position; */

		vPosition = position;

    // fully projected position
    vec4 glp = worldViewProjection * vec4(position, 1.);
    // xlate projected position slightly closer to 'near' then xform back to
    // local space
    vec4 p1 = inverse(worldViewProjection) * (glp - vec4(0.,0.,1.,0.));

    // ray direction is from 'nearer' to position
    vRayDir = position - (p1.xyz/p1.w);

		gl_Position = glp;
}
