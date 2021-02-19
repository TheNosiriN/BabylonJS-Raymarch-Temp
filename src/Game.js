
const RENDER_WIDTH = 0;//1920;
const RENDER_HEIGHT = 0;//1080;




var game = {
	engine: new BABYLON.Engine(canvas, false, {
		// useHighPrecisionMatrix: true,
		// useHighPrecisionFloats: true
	}),
	delta: 0,
	objects: {},
	mouseDX: 0,
	mouseDY: 0
}


function preload()
{
	//console.log(window.navigator.hardwareConcurrency);
	game.dsm = new BABYLON.DeviceSourceManager(game.engine);

}



var postProcessEffect;
var depthRenderer;
function postload()
{

	game.objectMarcher = initObjectMarcherPostProcess(game.scene.activeCamera, game);
}










var box, observer;
var planets = [];
var light;
var sun;

function create()
{
	game.time = 0.0;

	// game.camera = new BABYLON.ArcRotateCamera("camera", BABYLON.Tools.ToRadians(90), BABYLON.Tools.ToRadians(65), 30, BABYLON.Vector3.Zero(), game.scene);
	game.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0,0,20), game.scene);
	game.camera.setTarget(BABYLON.Vector3.Zero());
	game.camera.attachControl(canvas, true);
	game.camera.minZ = 0.01;
	game.camera.maxZ = 1000;

	game.depthRenderer = game.scene.enableDepthRenderer(game.camera, false, true);


	light = new BABYLON.DirectionalLight("dirLight", BABYLON.Vector3.Normalize(new BABYLON.Vector3(0, -0.5, -1)), game.scene);
	light.intensity = 0.7;


	for (var i=0; i<5; i++){
		planets[i] = new Planet("mesh"+i, {
			radius: 7
		}, game.scene);
		planets[i].setPosition(new BABYLON.Vector3((i-2)*25,0,10));
		planets[i].setSun(light.direction);
	}


	var csmShadowGenerator = new BABYLON.CascadedShadowGenerator(1024, light);
	// var csmShadowGenerator = new BABYLON.ShadowGenerator(1024, light);
  // csmShadowGenerator.usePercentageCloserFiltering = true;
  csmShadowGenerator.transparencyShadow = true;
	csmShadowGenerator.enableSoftTransparentShadow = true;


	var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 200, height: 100}, game.scene);
	ground.receiveShadows = true;
	var sphere = BABYLON.MeshBuilder.CreateSphere("sss", {diameter: 5*2, segments: 32}, game.scene);
	sphere.position = new BABYLON.Vector3(0, 0, 5);
	csmShadowGenerator.getShadowMap().renderList.push(sphere);



	for (var i=0; i<planets.length; i++){
		// planets[i].castShadows = true;
		csmShadowGenerator.getShadowMap().renderList.push(planets[i]);
	}




	document.getElementById("wireframe").onclick = function(){
		for (var i=0; i<planets.length; i++){
			planets[i].setWireframe(!planets[i].material.wireframe);
		}
	};
}







let divFps = document.getElementById("fps");
let cameraInfo = document.getElementById("cameraInfo");
const timeSpeed = 0.01;
var keyboard = null;


function step()
{
	game.time += timeSpeed;
	game.delta = game.engine.getDeltaTime();
	divFps.innerHTML = "|  "+game.engine.getFps().toFixed() + " fps  |";

	//cameraInfo.innerHTML = "pos: "+(game.camera.position)+"\ndir: "+(game.camera.getDirection(new BABYLON.Vector3.Up()));


	for (var i=0; i<planets.length; i++){
		planets[i].setCamera(game.scene.activeCamera);
		planets[i].setDepthMap(game.depthRenderer.getDepthMap());

		planets[i].rotation.y = (planets[i].rotation.y + 0.02 + (i*0.02)) % (Math.PI*2.0);
		planets[i].rotation.x = -planets[i].rotation.y;
		planets[i].rotation.z = (-planets[i].rotation.x - planets[i].rotation.y) % (Math.PI*2.0);

		if (UTILS.distanceToPoint3DV(game.scene.activeCamera.position, planets[i].position) < planets[i].radius*1.5){
			CURRENT_MARCHER_OBJECT = planets[i];
		}
	}

	if (CURRENT_MARCHER_OBJECT != null){
		// divFps.innerHTML = CURRENT_MARCHER_OBJECT.name;
		game.scene.activeCamera.attachPostProcess(game.objectMarcher);
	}else{
		game.scene.activeCamera.detachPostProcess(game.objectMarcher);
	}
}





// function updateUniverseNode()
// {
// 	game.universeNode.position = game.universeNode.position.subtract(game.camera.position);
// 	game.camera.position = new BABYLON.Vector3(0,0,0);
// }









window.addEventListener("DOMContentLoaded", function(){
    game.canvas = document.getElementById("canvas");
		game.engine.setSize(RENDER_WIDTH > 0 ? RENDER_WIDTH : window.innerWidth, RENDER_HEIGHT > 0 ? RENDER_HEIGHT : window.innerHeight);

    game.scene = new BABYLON.Scene(game.engine);
    // game.scene.clearColor = new BABYLON.Color3.Black();

		// game.scene.debugLayer.show({
    //      // embedMode:true
    // });

		loadResources(function()
		{
			preload();
	    create();
			postload();

			setupPointerLock();
	    // game.scene.detachControl();

	    game.scene.registerBeforeRender(function(){
					step();

					game.mouseDX = 0;
					game.mouseDY = 0;
	    });


			game.scene.registerAfterRender(function(){
					// postStep();
			});


			game.engine.runRenderLoop(function(){
	        game.scene.render();
	    });
		}, game.scene);
});

// the canvas/window resize event handler
window.addEventListener('resize', function(){
    game.engine.setSize(RENDER_WIDTH > 0 ? RENDER_WIDTH : window.innerWidth, RENDER_HEIGHT > 0 ? RENDER_HEIGHT : window.innerHeight);
});





//mouse lock
// Configure all the pointer lock stuff
function setupPointerLock()
{
    // register the callback when a pointerlock event occurs
    document.addEventListener('pointerlockchange', changeCallback, false);
    document.addEventListener('mozpointerlockchange', changeCallback, false);
    document.addEventListener('webkitpointerlockchange', changeCallback, false);

    // when element is clicked, we're going to request a
    // pointerlock
    canvas.onclick = function(){
        canvas.requestPointerLock =
            canvas.requestPointerLock ||
            canvas.mozRequestPointerLock ||
            canvas.webkitRequestPointerLock
        ;

        // Ask the browser to lock the pointer)
        canvas.requestPointerLock();
    };

}

var mouseMove = function(e)
{
    var movementX = e.movementX ||
            e.mozMovementX ||
            e.webkitMovementX ||
            0;

    var movementY = e.movementY ||
            e.mozMovementY ||
            e.webkitMovementY ||
            0;

		game.mouseDX = movementX;
		game.mouseDY = movementY;


		//updateCamera();
}

function changeCallback(e)
{
    if (document.pointerLockElement === canvas ||
        document.mozPointerLockElement === canvas ||
        document.webkitPointerLockElement === canvas
    ){
        document.addEventListener("mousemove", mouseMove, false);
    } else {
        document.removeEventListener("mousemove", mouseMove, false);
    }
};










// new test
// https://playground.babylonjs.com/#ACS28V#11
// https://playground.babylonjs.com/#76KW28#5

//shader
// https://cyos.babylonjs.com/#LP6PKE#4
// https://www.babylonjs-playground.com/#J8TKE6#17

// tps
// https://www.babylonjs-playground.com/#G703DZ#87


//planet shader
// https://playground.babylonjs.com/#H7SXJ7#23 //custom pbr
// https://cyos.babylonjs.com/#49TTWL#3
// https://cyos.babylonjs.com/#GV5MFS //atmospheric scattering 1
// https://cyos.babylonjs.com/#GV5MFS#9 //atmospheric scattering 2
// https://playground.babylonjs.com/#LY3FVX#4 atm scattering

// https://cyos.babylonjs.com/#74KX30
