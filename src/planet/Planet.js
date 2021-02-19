class Planet extends BABYLON.Mesh
{
	constructor(name, opt, scene)
	{
		super(name, scene);

		this.TIME = 0;
		this.SEED = 0;
		this.scene = scene;
		this.radius = opt.radius || 10;
    this.maxHeight = opt.maxHeight || 0.0025;
		this.sunDir = BABYLON.Vector3.Normalize(new BABYLON.Vector3(0, 0.5, 1));

		var vertexData = BABYLON.VertexData.CreateSphere({diameter: this.radius*3, segments: 8});
		vertexData.applyToMesh(this);

		this.material = new BABYLON.ShaderMaterial("Planet", this.scene, {
	      vertex: "Planet",
	      fragment: "Planet",
	  },{
	      attributes: ["position"],
	      uniforms: [
	          "world", "worldView", "worldViewProjection",
	          "view", "projection", "viewProjection", "TIME",
	          "Radius", "MaxHeight", "SEED", "Position",

						"sunDir",
						"depthMap",
						"camera.size",
						"camera.far", "camera.near",
			      "camera.world", "camera.view",
			      "camera.projection", "camera.transform",
			      "camera.position", "camera.direction", "camera.fov",
	      ],

				needAlphaBlending: true,
        needAlphaTesting: true
	  });
		this.material.backFaceCulling = false;
		this.material.shadowDepthWrapper = new BABYLON.ShadowDepthWrapper(this.material, this.scene);


		this.setSun(this.sunDir);
		this.setPosition(this.position);
		this.material.setInt("SEED", this.SEED);
		this.material.setFloat("TIME", this.TIME);
		this.material.setFloat("Radius", this.radius);
		this.material.setFloat("MaxHeight", this.maxHeight);
	}


	update(time)
	{
		this.TIME = time;
		this.material.setFloat("TIME", this.TIME);
	}

	setSun(o){
		this.sunDir = o;
		this.material.setVector3("sunDir", this.sunDir);
	}

	setWireframe(o){
		this.material.wireframe = o;
	}

	setPosition(p){
		this.position = p;
		this.material.setVector3("Position", this.position);
	}

	setDepthMap(m){
		this.material.setTexture("depthMap", m);
	}

	setCamera(camera){
		this.material.setVector3("camera.direction", camera.getForwardRay(1).direction);
		this.material.setVector3("camera.position", camera.position);//.subtract(this.position));

		this.material.setFloat("camera.fov", camera.fov);
    this.material.setFloat("camera.far", camera.maxZ);
    this.material.setFloat("camera.near", camera.minZ);

    this.material.setMatrix('camera.view', camera.getViewMatrix());
		this.material.setMatrix('camera.world', camera.getWorldMatrix());
    this.material.setMatrix('camera.projection', camera.getProjectionMatrix());
    this.material.setMatrix('camera.transform', camera.getTransformationMatrix());

		this.material.setVector2("camera.size", new BABYLON.Vector2(camera.viewport.width*this.scene.getEngine().getRenderWidth(), camera.viewport.height*this.scene.getEngine().getRenderHeight()));
	}
}







var CURRENT_MARCHER_OBJECT = null;
function initObjectMarcherPostProcess(camera, game)
{
	var pp = new BABYLON.PostProcess(
      "SOCA", "Planet",
      [
				"TIME", "world",
				"Radius", "MaxHeight", "SEED", "Position",

				"sunDir",
				"depthMap",
				"camera.size",
				"camera.far", "camera.near",
				"camera.world", "camera.view",
				"camera.projection", "camera.transform",
				"camera.position", "camera.direction", "camera.fov",
      ], [
				"depthMap"
			], 1.0, camera, 0, game.engine, false,
			`
				#define POST_PROCESS_LEVEL
			`
  );
	pp.renderTargetSamplingMode = BABYLON.Texture.NEAREST_LINEAR_MIPLINEAR


  pp.onApply = function(effect)
  {
      if (CURRENT_MARCHER_OBJECT != null){
				let obj = CURRENT_MARCHER_OBJECT;
				effect.setInt("SEED", obj.SEED);
				effect.setFloat("TIME", obj.TIME);
				effect.setFloat("Radius", obj.radius);
				effect.setFloat("MaxHeight", obj.maxHeight);

				effect.setVector3("sunDir", obj.sunDir);
				effect.setVector3("Position", obj.position);
				effect.setMatrix("world", obj.getWorldMatrix());


				effect.setTexture("depthMap", game.depthRenderer.getDepthMap());

				effect.setVector3("camera.direction", camera.getForwardRay(1).direction);
				effect.setVector3("camera.position", camera.position);//.subtract(obj.position));

				effect.setFloat("camera.fov", camera.fov);
		    effect.setFloat("camera.far", camera.maxZ);
		    effect.setFloat("camera.near", camera.minZ);

		    effect.setMatrix('camera.view', camera.getViewMatrix());
				effect.setMatrix('camera.world', camera.getWorldMatrix());
		    effect.setMatrix('camera.projection', camera.getProjectionMatrix());
		    effect.setMatrix('camera.transform', camera.getTransformationMatrix());
			}

			effect.setVector2("camera.size", new BABYLON.Vector2(pp.width, pp.height));//camera.viewport.width*window.innerWidth, camera.viewport.height*window.innerHeight));

			CURRENT_MARCHER_OBJECT = null;
  }

	return pp;
}
