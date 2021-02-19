

#define PI 3.1415972
#define dot2(v) dot(v,v)
#define mind(a, b) (a.x < b.x ? a:b)
#define maxd(a, b) (a.x > b.x ? a:b)
#define saturate(x) clamp(x, 0.0, 1.0)


struct Camera {
    vec3 position;
    vec3 direction;

		vec2 size;
    float fov;
    float far;
    float near;

    mat4 view;
    mat4 world;
    mat4 transform;
    mat4 projection;
};
uniform Camera camera;



const float EPSILON = 0.0001;
const float MAX_DIST = 100.0;




float remap(float val, float OldMin, float OldMax, float NewMin, float NewMax){
    return (((val - OldMin) * (NewMax - NewMin)) / (OldMax - OldMin)) + NewMin;
}




vec3 toViewSpace(vec3 pos, vec3 dir, float dist)
{
    vec3 posIntersectInWorldSpace = vec3(pos + dist * dir);
    vec4 posInViewSpace = camera.view * vec4(posIntersectInWorldSpace, 1);
    return posInViewSpace.xyz;
}

float toWorldSpace(float depth, vec2 uv)
{
		vec3 viewVector = (inverse(camera.projection) * vec4(uv * 2.0 - 1.0, 0.0, -1.0)).xyz;
		viewVector = (inverse(camera.view) * vec4(viewVector, 0.0)).xyz;
		float viewLength = length(viewVector);
		return depth * viewLength;
}




vec3 rayDirection(float fieldOfView, vec2 size, vec2 fragCoord) {
    vec2 xy = (fragCoord*2.0) - size;
    float z = size.y / tan(fieldOfView / 2.0);
    return normalize(vec3(xy, -z));
}


mat4 viewMatrix(vec3 eye, vec3 direction, vec3 up) {
    vec3 f = -direction;
    vec3 s = normalize(cross(f, up));
    vec3 u = cross(s, f);
    return mat4(
        vec4(s, 0.0),
        vec4(u, 0.0),
        vec4(f, 0.0),
        vec4(0.0, 0.0, 0.0, 1)
    );
}


vec3 getFragmentRay(vec3 eye, vec2 fragCoord)
{
    vec3 viewDir = rayDirection(camera.fov, camera.size, fragCoord);
    mat4 viewToWorld = viewMatrix(eye, camera.direction, vec3(0.0, 1.0, 0.0));
    return (viewToWorld * vec4(viewDir, 0.0)).xyz;
}





vec3 getUVRay(vec2 uv)
{
    mat4 invMat =  inverse(camera.transform);
    vec4 near = vec4((uv.x - 0.5) * 2.0, (uv.y - 0.5) * 2.0, -1, 1.0);
    vec4 far = vec4((uv.x - 0.5) * 2.0, (uv.y - 0.5) * 2.0, 1, 1.0);
    vec4 nearResult = invMat*near;
    vec4 farResult = invMat*far;
    nearResult /= nearResult.w;
    farResult /= farResult.w;
    vec3 dir = vec3(farResult - nearResult );
    return normalize(dir);
}
