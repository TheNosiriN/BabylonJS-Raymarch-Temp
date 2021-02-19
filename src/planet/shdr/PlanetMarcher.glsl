precision highp float;
precision highp sampler2D;

#ifndef POST_PROCESS_LEVEL
varying vec3 vPosition;
varying vec3 vRayDir;
#else
uniform sampler2D textureSampler;
#endif

uniform mat4 world;
uniform mat4 worldInv;
uniform sampler2D depthMap;


#include<Utils>


uniform int SEED;
uniform float TIME;
uniform vec3 sunDir;
uniform float Radius;
uniform vec3 Position;
uniform float maxHeight;







float pModPolar(inout vec2 p, float repetitions) {
	float angle = 2.0*PI/repetitions;
	float a = atan(p.y, p.x) + angle/2.0;
	float r = length(p);
	float c = floor(a/angle);
	a = mod(a,angle) - angle/2.0;
	p = vec2(cos(a), sin(a))*r;
	if (abs(c) >= (repetitions/2.0)) c = abs(c);
	return c;
}
float bBox( vec3 p, vec3 b, float e )
{
       p = abs(p  )-b;
  vec3 q = abs(p+e)-e;

  return min(min(
      length(max(vec3(p.x,q.y,q.z),0.0))+min(max(p.x,max(q.y,q.z)),0.0),
      length(max(vec3(q.x,p.y,q.z),0.0))+min(max(q.x,max(p.y,q.z)),0.0)),
      length(max(vec3(q.x,q.y,p.z),0.0))+min(max(q.x,max(q.y,p.z)),0.0));
}

//Made by Me :)
float floatingThing(vec3 p, float scale)
{
    p /= scale;
    //p.xz = abs(p.xz);

    float r = 1.0;
    float h = 3.0;

    float bd = length(p) - r*1.25;
    bd = max(bd, p.y);

    float cone = length(p.xz) - mix(r*1.25, 0.0, smoothstep(0.0, r, p.y));
    cone = max(cone, abs(p.y-r/3.0)-r/3.0);
    p.y -= r/2.25;

    float stand = length(p.xz) - r/6.0;
    stand = max(stand, abs(p.y-h/2.0)-h/2.0);

    vec3 boxs = vec3(0,h/2.0,0);
    boxs.x = mix(r/1.5, r/2.0, smoothstep(0.0, h, p.y));
    boxs.z = boxs.x;
    float box = bBox(p-vec3(0,h/2.0-0.1,0), boxs, 0.05);

    vec3 xp = p;
    float c = pModPolar(xp.xz, 4.0);
    xp.x -= boxs.x;
    xp.y -= r/2.0 + 0.05;
    xp = abs(xp);
    float xsdf = max(xp.z-abs(xp.y)-0.05, -(xp.z-xp.y)-0.05);
    xsdf = max(xsdf, max(xp.y-0.5, xp.x-EPSILON));

    float sgn = max((xp.x-EPSILON*10.0), abs(p.y-h/1.5)-h/6.0);
    sgn = max(-sgn, max((xp.x-EPSILON*10.0), abs(p.y-h/1.5)-h/8.0)-0.05);


    bd = min(bd, length(p-vec3(0,h+r/2.0,0))-r/1.8);
    bd = min(bd, stand);
    bd = min(bd, cone);
    bd = min(bd, box);
    bd = min(bd, sgn);
    bd = min(bd, xsdf);

    return bd;
}










vec3 comp(vec3 p)
{
	vec3 q = abs(p) - Radius/1.25;
	float d = max(q.y, max(q.x, q.z));

	float m = d;
	d = max(d, -(length(p)-Radius));

	/* d = min( max(m+Radius/3.0, -(length(p)-Radius/1.75 )), d ); */
	/* d = min( max(m+Radius/2.5+Radius/2.5, -(length(p)-Radius/2.5 )), d ); */
	/* d = min( max(m+Radius/i, -(length(p)-Radius/(i+0.5))), d ); */

	/* for (float i=1.0; i<=4.0; i++){
		float pp = i/5.0;float diff = 2.0;
		d = min( max(m+Radius/(diff/pp), -(length(p)-Radius/(diff*pp+(pp/diff)) )), d );
	} */
	d = min(d, length(p)-Radius/6.0);

	/* p *= 2.0; */
	/* float d = floatingThing(p, 2.0); */

	return vec3(d, 0,0);
}




vec4 raymarch(vec3 eye, vec3 dir, float start, float maxdist)
{
    vec3 info = vec3(0);
    float depth = start, i;
    for (i=0.0; i<256.0 && depth<maxdist; i++){
				#ifdef POST_PROCESS_LEVEL
				vec3 p = vec3(inverse(world) * vec4(eye + depth * dir,1));
				#else
				vec3 p = eye + depth * dir;
				#endif
        info = comp(p);
        if (abs(info.x) < EPSILON)break;
        depth += info.x;
    }
    return vec4(depth, info.yz, i/256.0);
}







/* vec4 raymarch(vec3 eye, vec3 dir, float start, float maxdist)
{
    float omega = 1.2;
    float t = start;
    float candidate_error = maxdist;
    float candidate_t = 0.0;
    float previousRadius = 0.0;
    float stepLength = 0.0;
    float functionSign = comp(eye).x < 0.0 ? -1.0 : +1.0;
    float pixelRadius = 1.0/camera.size.x;
    bool forceHit = false;
    vec3 info;

    float i;
    for (i = 0.0; i < 256.0; ++i)
    {
				vec3 p = vec3(world * vec4(eye + t * dir, 1))-Position;
				info = comp(p);

        float signedRadius = functionSign * info.x;
        float radius = abs(signedRadius);
        bool sorFail = omega > 1.0 &&
        (radius + previousRadius) < stepLength;

        if (sorFail) {
            stepLength -= omega * stepLength;
            omega = 1.0;
        } else {
            stepLength = signedRadius * omega;
        }
        previousRadius = radius;
        float error = radius / t;
        if (!sorFail && error < candidate_error) {
            candidate_t = t;
            candidate_error = error;
        }
        if (!sorFail && error < pixelRadius || t > maxdist)break;

				t += stepLength;
    }
    if ((t > maxdist || candidate_error > pixelRadius) &&
    !forceHit) return vec4(maxdist,0,0,0);

    return vec4(candidate_t, info.yz, i/256.0);

} */









vec3 normal(vec3 p)
{
 	vec3 P = vec3(-4, 4, 0) * EPSILON;
 	return normalize(
        comp(p+P.xyy).x *
        P.xyy + comp(p+P.yxy).x *
        P.yxy + comp(p+P.yyx).x *
        P.yyx + comp(p+P.xxx).x *
        P.xxx
    );
}



vec4 makeObj(vec3 cameraPos, vec2 uv)
{
		vec4 color;


		//get current depth
		float depth = texture2D(depthMap, uv).r;
		float rdepth = remap(depth, 0.0, 1.0, camera.near, camera.far);
		rdepth = toWorldSpace(rdepth, uv);


		//construct ray
		#ifdef POST_PROCESS_LEVEL
		vec3 eye = cameraPos;
		vec3 dir = getUVRay(uv);
		#else
		vec3 eye = vPosition;
		vec3 dir = normalize(vRayDir);
		rdepth -= distance(vec3(inverse(world) * vec4(cameraPos, 1.0)), vPosition);
		#endif




		//march
		float maxdist = 0.0 + Radius*3.0;
		vec4 dist = raymarch(eye, dir, 0.0, maxdist);

		//shade
		if (dist.x < maxdist && dist.x < rdepth){
			#ifdef POST_PROCESS_LEVEL
			vec3 P = vec3(worldInv * vec4(eye + dir * dist.x, 1));
			vec3 N = normalize(vec3(world * vec4(normal(P), 0)));
			#else
			vec3 P = eye + dir * dist.x;
			vec3 N = normalize(vec3(world * vec4(normal(P), 0)));
			#endif

			float shading = saturate(dot(N, -sunDir)*0.5+0.25);
      shading = mix(shading, shading*0.5, saturate(dot(N, normalize(cameraPos))) );

			shading = mix(shading*0.5, shading, saturate(1.0-pow(dist.w,3.0)*3.0));
			color.xyz += shading;
			color.a = 1.0;
		}

		color.xyz = pow(color.xyz, vec3(1.0/2.2));
    return color;
}








void main(void){
	vec2 uv = gl_FragCoord.xy/camera.size;
	vec4 color = makeObj(camera.position, uv);

	#ifdef POST_PROCESS_LEVEL
	color = mix(texture(textureSampler, uv), color, color.a);
	#else
	if (color.a <= 0.0){color.a = 0.25;}//discard;

	float alpha = color.a;
	#define SHADOWDEPTH_SOFTTRANSPARENTSHADOW
  #define SHADOWDEPTH_FRAGMENT

	#endif

	gl_FragColor = color;
}




























/*


precision highp float;
precision highp sampler2D;

#ifndef POST_PROCESS_LEVEL
varying vec3 vPosition;
#else
uniform sampler2D textureSampler;
#endif

uniform mat4 world;
uniform sampler2D depthMap;


#include<Utils>


uniform int SEED;
uniform float TIME;
uniform vec3 sunDir;
uniform float Radius;
uniform vec3 Position;
uniform float maxHeight;




vec3 comp(vec3 p)
{
	vec3 q = abs(p) - Radius/1.25;
	float d = max(q.y, max(q.x, q.z));
	d = max(d, -(length(p)-Radius));//min(min(d, (length(p)-Radius)), d+Radius/2.0);

	return vec3(d, 0,0);
}


vec4 raymarch(vec3 eye, vec3 dir, float start, float maxdist)
{
    vec3 info = vec3(0);
    float depth = start, i;
    for (i=0.0; i<256.0 && depth<maxdist; i++){
        vec3 p = vec3(world * vec4(eye + depth * dir, 1))-Position;
        info = comp(p);
        if (abs(info.x) < EPSILON * depth)break;
        depth += info.x;// * remap(i,0.0,256.0,0.5,1.0);
    }
    return vec4(depth, info.yz, i/256.0);
}



vec3 normal(vec3 p)
{
 	vec3 P = vec3(-4, 4, 0) * EPSILON;
 	return normalize(
        comp(p+P.xyy).x *
        P.xyy + comp(p+P.yxy).x *
        P.yxy + comp(p+P.yyx).x *
        P.yyx + comp(p+P.xxx).x *
        P.xxx
    );
}



vec4 makeObj()
{
		vec4 color;
		vec2 uv = gl_FragCoord.xy/camera.size;

		//construct ray

		vec3 cameraPos = camera.position - Position;

		#ifdef POST_PROCESS_LEVEL
		float startdist = 0.0;
		#else
		vec3 vPositionW = vec3(world * vec4(vPosition, 1.0));
		float startdist = distance(cameraPos, vPositionW-Position);
		#endif

		vec3 eye = cameraPos;//dot2(cameraPos) < dot2(vPositionW) ? cameraPos : vPositionW;
		vec3 dir = getFragmentRay(eye, gl_FragCoord.xy);


		//get current depth
		float maxdist = startdist + Radius*3.0;

		float depth = texture2D(depthMap, uv).r;
		float rdepth = remap(depth, 0.0, 1.0, camera.near, camera.far);
		rdepth = toWorldSpace(rdepth, uv);


		//march
		vec4 dist = raymarch(cameraPos, dir, startdist, maxdist);
		dist.x = min(dist.x, rdepth);

		//shade
		if (dist.x < maxdist && dist.x != rdepth){
			vec3 P = vec3(world * vec4(eye + dir * dist.x, 1));
			vec3 N = normalize(vec3(inverse(world) * vec4(normal(P-Position), 0)));

			float shading = saturate(dot(N, -sunDir)*0.5+0.25);
      shading = mix(min(1.0,shading*3.0), shading, dot(normalize(eye), N));

			color.xyz += shading;
			color.a = 1.0;
		}

    return color;
}








void main(void){
	vec4 color = makeObj();

	#ifdef POST_PROCESS_LEVEL
	color = mix(texture(textureSampler, gl_FragCoord.xy/camera.size), color, color.a);
	#endif

	gl_FragColor = color;
}



 */
