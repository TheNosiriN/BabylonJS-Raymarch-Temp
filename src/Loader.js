function loadResources(callback, scene)
{
	var load = function(state)
	{
		switch (state){
			case 0: loadShaders(() => load(1)); break;
			// case 2: loadAssets(() => load(3)); break;
			// case 3: setupCompGLProgram(() => load(4)); break;
			default: callback(); break;
		}
	}

	load(0);
}







function loadShaders(callback)
{
	Promise.all([
		UTILS.loadFile("src/Tools/Utils.glsl"), //data 0
		UTILS.loadFile("src/planet/shdr/PlanetVertex.glsl"), //data 1
		UTILS.loadFile("src/planet/shdr/PlanetMarcher.glsl"), //data 2
	]).then(function(data)
	{


		BABYLON.Effect.IncludesShadersStore["Utils"] = data[0];

		BABYLON.Effect.ShadersStore["PlanetVertexShader"] = data[1];
		BABYLON.Effect.ShadersStore["PlanetFragmentShader"] = data[2];
		// BABYLON.Effect.ShadersStore["PlantFragmentShader"] = `
		// precision highp float;
		// void main(void){
		// 	gl_FragColor = vec4(vec3(0),1);
		// }
		// `

		console.log("All Shaders loaded");
		callback();
	});
}





var ASSET_MANAGER = null;
var ROCK_ONE_TEXTURE = [];
var GRASS_ONE_TEXTURE = [];

function loadAssets(callback)
{
	ASSET_MANAGER = new BABYLON.AssetsManager(game.scene);

	ASSET_MANAGER.onProgress = function(remainingCount, totalCount, lastFinishedTask) {
	    console.log((remainingCount+1) + ' out of ' + totalCount + ' textures need to be loaded.');
	};

	ASSET_MANAGER.onTaskErrorObservable.add(function(task) {
	    console.log('task failed: ', task.errorObject.message, task.errorObject.exception);
	});

	ASSET_MANAGER.onFinish = function(tasks) {
		callback();
	};



	/// Rock 1
	ASSET_MANAGER.addTextureTask("rock1", "res/textures/material/rock/rock1/diff_1k.png").onSuccess = function(task){ ROCK_ONE_TEXTURE[0] = task.texture; }
	ASSET_MANAGER.addTextureTask("rock1", "res/textures/material/rock/rock1/nor_1k.png").onSuccess = function(task){ ROCK_ONE_TEXTURE[1] = task.texture; }
	ASSET_MANAGER.addTextureTask("rock1", "res/textures/material/rock/rock1/rough_1k.png").onSuccess = function(task){ ROCK_ONE_TEXTURE[2] = task.texture; }
	ASSET_MANAGER.addTextureTask("rock1", "res/textures/material/rock/rock1/ao_1k.png").onSuccess = function(task){ ROCK_ONE_TEXTURE[3] = task.texture; }


	/// Grass 1
	ASSET_MANAGER.addTextureTask("grass1", "res/textures/material/grass/grass1/diff_1k.png").onSuccess = function(task){ GRASS_ONE_TEXTURE[0] = task.texture; }
	ASSET_MANAGER.addTextureTask("grass1", "res/textures/material/grass/grass1/nor_1k.png").onSuccess = function(task){ GRASS_ONE_TEXTURE[1] = task.texture; }
	ASSET_MANAGER.addTextureTask("grass1", "res/textures/material/grass/grass1/rough_1k.png").onSuccess = function(task){ GRASS_ONE_TEXTURE[2] = task.texture; }
	ASSET_MANAGER.addTextureTask("grass1", "res/textures/material/grass/grass1/ao_1k.png").onSuccess = function(task){ GRASS_ONE_TEXTURE[3] = task.texture; }





	ASSET_MANAGER.load();

}









var IRRADIANCE_TEXTURE;
var SCATTERING_TEXTURE;
var TRANSMITTANCE_TEXTURE;
var SINGLE_MIE_SCATTERING_TEXTURE;

const TRANSMITTANCE_TEXTURE_WIDTH = 256;
const TRANSMITTANCE_TEXTURE_HEIGHT = 64;
const SCATTERING_TEXTURE_WIDTH = 256;
const SCATTERING_TEXTURE_HEIGHT = 128;
const SCATTERING_TEXTURE_DEPTH = 32;
const IRRADIANCE_TEXTURE_WIDTH = 64;
const IRRADIANCE_TEXTURE_HEIGHT = 16;

function loadAtmosphereDataTextures(callback, scene)
{
	// Atmosphere Shader Textures
	UTILS.loadTextureData("res/atmosphere/irradiance.raw", function(data){
		IRRADIANCE_TEXTURE = new BABYLON.RawTexture(
			data, IRRADIANCE_TEXTURE_WIDTH, IRRADIANCE_TEXTURE_HEIGHT,
			BABYLON.Engine.TEXTUREFORMAT_RGB, scene, false, false,
      BABYLON.Texture.LINEAR_LINEAR, BABYLON.Engine.TEXTURETYPE_FLOAT
		);
	});

	UTILS.loadTextureData("res/atmosphere/inscatter.raw", function(data){
		SCATTERING_TEXTURE = new BABYLON.RawTexture3D(
			data, SCATTERING_TEXTURE_WIDTH, SCATTERING_TEXTURE_HEIGHT, SCATTERING_TEXTURE_DEPTH,
			BABYLON.Engine.TEXTUREFORMAT_RGBA, scene, false, false,
      BABYLON.Texture.LINEAR_LINEAR, BABYLON.Engine.TEXTURETYPE_FLOAT
		);
	});

	UTILS.loadTextureData("res/atmosphere/transmittance.raw", function(data){
		TRANSMITTANCE_TEXTURE = new BABYLON.RawTexture(
			data, TRANSMITTANCE_TEXTURE_WIDTH, TRANSMITTANCE_TEXTURE_HEIGHT,
			BABYLON.Engine.TEXTUREFORMAT_RGB, scene, false, false,
      BABYLON.Texture.LINEAR_LINEAR, BABYLON.Engine.TEXTURETYPE_FLOAT
		);
	});

	//dummy texture stuff
	let dummyData = new Float32Array(32);
	SINGLE_MIE_SCATTERING_TEXTURE = new BABYLON.RawTexture3D(
		dummyData, 2, 2, 2, BABYLON.Engine.TEXTUREFORMAT_RGBA,
		scene, false, false, BABYLON.Texture.LINEAR_LINEAR,
		BABYLON.Engine.TEXTURETYPE_FLOAT
	);
	//


	let checker = setInterval(function(){
		if (
			IRRADIANCE_TEXTURE == null ||
			SCATTERING_TEXTURE == null ||
			TRANSMITTANCE_TEXTURE == null ||
			SINGLE_MIE_SCATTERING_TEXTURE == null
		){ return; }

		clearInterval(checker);

		console.log("All Data textures loaded");
		callback();
	}, 10);
}








var COMP_GL = null;
var COMP_GL_PROGRAM = null;

function setupCompGLProgram(callback)
{
	function getShader(gl, source, type){
    let sh = gl.createShader(type);
    gl.shaderSource(sh, source);
    gl.compileShader(sh);
    console.log('Shader Status:', gl.getShaderInfoLog(sh));
    return sh;
	}



	const gl = canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2');
	COMP_GL = gl;
  // console.log(gl);

	const program = gl.createProgram();
	COMP_GL_PROGRAM = program;
  gl.attachShader(program, getShader(gl, `#version 300 es\n`+TERRAIN_TRANSFORM, gl.VERTEX_SHADER));
  gl.attachShader(program, getShader(gl, `#version 300 es\n`+`void main(void) {}`, gl.FRAGMENT_SHADER));
  gl.transformFeedbackVaryings(program, ['outPosition'], gl.SEPARATE_ATTRIBS);

  gl.linkProgram(program);
  console.log('Program Status:', gl.getProgramInfoLog(program));
  gl.useProgram(program);


	callback();
}
