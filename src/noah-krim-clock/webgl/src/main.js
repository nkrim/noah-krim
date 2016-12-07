/**
	main.js: main interface to coordinate webgl actions for the noah-krim-clock polymer element
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** Preset variables
	============================	*/
	/** Debug
	----------------------------	*/
	var DEBUG = true;
	/** Context
	----------------------------	*/
	var BASE = '/src/noah-krim-clock/webgl';	// Base URL
	/** Models
	----------------------------	*/
	var meshesSrcDef = {	// Meshes source definition (key: name, value: {src[, type=Mesh][, uniforms={}][, usage=STATIC_DRAW]})
		line: {
			src: BASE+'/data/LineSmall.obj',
			mode: 'TRIANGLES',
			uniforms: {
				lighting_on: clockgl.UNIFORM_TRUE,
			},
		},
	};
	var meshesRawDef = {	// Raw definitions for meshes (key: name, value: {init, options, uniforms}) [Raw mesh `init` function: functoin(gl, options, meshUniformsDef)]
		axis: {
			init: clockgl.rawSingleLineMesh,
			options: {
				start: $V([0.0, 0.0, 0.0]),
				end: $V([100.0, 0.0, 0.0]),
			},
			uniforms: {
				lighting_on: clockgl.UNIFORM_FALSE,
			},
		},
	};
	/** Scene Objects
	----------------------------	*/
	var modelsDef = {		// Models definition (key: name, value: {mesh[, color=white][, world={base,scale,rot,trans}][, uniforms={}]})
		// Axes
		xaxis: {
			mesh: 'axis',
			color: $V([1.0, 0.0, 0.0, 1.0]),
		},
		yaxis: {
			mesh: 'axis',
			color: $V([0.0, 1.0, 0.0, 1.0]),
			world: {
				rot: Matrix.RotationZ(clockgl.radians(90)),
			},
		},
		zaxis: {
			mesh: 'axis',
			color: $V([0.0, 0.0, 1.0, 1.0]),
			world: {
				rot: Matrix.RotationY(clockgl.radians(-90)),
			},
		},
		laxis: {
			mesh: 'axis',
			color: $V([1.0, 1.0, 0.0, 1.0]),
		},
		// Sourced
		line0: {
			mesh: 'line',
			color: $V([1.0, 1.0, 1.0, 1.0]),
			world: {
				scale: $V([0.1, 0.1, 0.1]),
				trans: $V([0.0,-6.0, 0.0]),
			},
		},
	};
	/** View
	----------------------------	*/
	var background = $V([0.0, 0.0, 0.0, 1.0]);
	var fovy = 45;
	var aspect = 640.0/480.0;
	var znear = 0.1;
	var zfar = 500.0;
	/** Camera initials
	----------------------------	*/
	var cam_pos = $V([10.0, 5.0, 25.0]);
	var cam_look = $V([0.0, 0.0, 0.0]);
	var cam_up = $V([0.0, 1.0, 0.0]);
	/** Global lighting
	----------------------------	*/
	var lightingDef = {
		ambient: {
			ambient_col: $V([1.0, 1.0, 1.0]),
			ambient_int: $V([0.5]),
		},
		diffuse: {
			diffuse_cam: new clockgl.Camera($V([-1,1,1]),$V([0,0,0]),$V([0,1,0])), //TEMP
			diffuse_dir: $V([1.0, -.0, -1.0]).toUnitVector(),
			diffuse_col: $V([1.0, 1.0, 1.0]), 
			diffuse_int: $V([0.5]),
		},
	};
	/** Shader definition
	----------------------------	*/
	var vertexShaderSrc = '/src/noah-krim-clock/webgl/shaders/shader.vsh';
	var fragmentShaderSrc = '/src/noah-krim-clock/webgl/shaders/shader.fsh';
	var attributeNames = ['position', 'normal', 'color'];
	var uniformsLayoutDef = {	// {key: name, value: {type, default}}
		scene: {
			projection: 	{
				type: clockgl.UNIFORM.MAT4F,
				default: makePerspective(fovy, aspect, znear, zfar),
			},
			modelView: 		{
				type: clockgl.UNIFORM.MAT4F,
				default: Matrix.I(4),
			},
			/*camPos: 		{
				type: clockgl.UNIFORM.VEC3F,
				default: cam_pos,
			},*/
			ambient_col: {
				type: clockgl.UNIFORM.VEC3F,
				default: lightingDef.ambient.ambient_col,
			},
			ambient_int: {
				type: clockgl.UNIFORM.VEC1F,
				default: lightingDef.ambient.ambient_int,
			},
			diffuse_dir: 	{
				type: clockgl.UNIFORM.VEC3F,
				default: lightingDef.diffuse.diffuse_dir,
			}, 
			diffuse_col: 	{
				type: clockgl.UNIFORM.VEC3F,
				default: lightingDef.diffuse.diffuse_col,
			},
			diffuse_int: 	{
				type: clockgl.UNIFORM.VEC1F,
				default: lightingDef.diffuse.diffuse_int,
			},
		},
		model: {
			base: 			{
				type: clockgl.UNIFORM.MAT4F,
				default: Matrix.I(4),
			},
			scale: 			{
				type: clockgl.UNIFORM.MAT4F,
				default: Matrix.I(4),
			},
			rotation: 			{
				type: clockgl.UNIFORM.MAT4F,
				default: Matrix.I(4),
			},
			translation: 			{
				type: clockgl.UNIFORM.MAT4F,
				default: Matrix.I(4),
			},
		},
		mesh: {
			lighting_on: 	{
				type: clockgl.UNIFORM.VEC1I,
				default: clockgl.UNIFORM_FALSE,
			},
			ambient_on: 	{
				type: clockgl.UNIFORM.VEC1I,
				default: clockgl.UNIFORM_TRUE,
			},
			diffuse_on: 	{
				type: clockgl.UNIFORM.VEC1I,
				default: clockgl.UNIFORM_TRUE,
			},
		},
	};

	/**	Private variables
	============================	*/
	/**	Context variables
	----------------------------	*/
	var canvas;
	var gl;
	/** Shader programs
	----------------------------	*/
	var shaderProgram;
	/** View variables
	----------------------------	*/
	var camera;
	var projection;
	/** Model/SceneObj variables
	----------------------------	*/
	var meshes;
	var models;
	/** Attribute locations
	----------------------------	*/
	var attributeLocs;
	/** Uniforms and locations
	----------------------------	*/
	var uniformsLayout; 
	var sceneUniforms;
	/** Run instance
	----------------------------	*/
	var runInterval;
	/** Input handler
	----------------------------	*/
	var handler;

	clockgl.start = function(canvasElement) {
		canvas = canvasElement;

		// Initialize the GL context
		gl = initWebGL(canvas);
		if(!gl)
			return null;     

		// Only continue if WebGL is available and working
		if (gl) {
			gl.clearColor.apply(gl, background.flatten());  // Clear to background, fully opaque
			gl.clearDepth(1.0);                 // Clear everything
			gl.enable(gl.DEPTH_TEST);           // Enable depth testing
			gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
			gl.enable(gl.CULL_FACE);			// Enable face culling
			gl.cullFace(gl.BACK);				// Cull backs

			// Init camera
			camera = new clockgl.Camera(cam_pos, cam_look, cam_up);

			// Init input handler
			handler = new clockgl.InputHandler(canvas);

			// Shaders deferred actions
			var shaderDeferred = clockgl.initShaderProgram(gl, vertexShaderSrc, fragmentShaderSrc)
				.then(function(sp) {
					try {
						// Set the shaderProgram
						shaderProgram = sp;

						// Initialize the shaders
						gl.useProgram(shaderProgram);

						// Get and enable attribute locations
						attributeLocs = {};
						$.each(attributeNames, function(index, name) {
							var loc = gl.getAttribLocation(shaderProgram, name);
							gl.enableVertexAttribArray(loc);
							attributeLocs[name] = loc;
						});
						console.log(attributeLocs);

						// Create projection/modelView matrices
						projection = makePerspective(fovy, aspect, znear, zfar);

						// Get uniform locations
						uniformsLayout = {};
						$.each(uniformsLayoutDef, function(context, uniformsDef) {
							uniformsLayout[context] = clockgl.mapObj(uniformsDef, function(opts, name) {
								var loc = gl.getUniformLocation(shaderProgram, name);
								var uniform = new clockgl.Uniform(opts.type, loc, opts.default);
								return uniform;
							});
						});
						updateSceneUniforms();
						console.log(sceneUniforms);
					}
					catch (e) {
						return $.Deferred().reject(e);
					}
				});

			// Meshes/Models deferred actions
			//var meshesDeferred = clockgl.loadMeshes(gl, meshesSrcDef)
			var meshesDeferred = clockgl.loadMeshesFromLoader(gl, meshesSrcDef)
				.then(function(m) {
					try {
						// Set the models dictionary
						meshes = m;
						// Init raw meshes
						var rawMeshes = clockgl.mapObj(meshesRawDef, function(opts, name) {
							return opts.init(gl, opts.options, opts.uniforms);
						});
						// Add raw meshes (sourced meshes have priority)
						meshes = $.extend(rawMeshes, meshes);
						console.log(meshes);

						// Construct models from modelsDef
						models = clockgl.mapObj(modelsDef, function(opt) {
							var world = opt.world ? new clockgl.World(opt.world.base, opt.world.scale, opt.world.rotation || opt.world.rot, opt.world.translation || opt.world.trans) : undefined;
							return new clockgl.Model(gl, meshes[opt.mesh], opt.color, world);
						});
						console.log(models);
					}
					catch (e) {
						return $.Deferred().reject(e);
					}
				});

			// When shaders and models are done...
			$.when(shaderDeferred, meshesDeferred)
				.always(function() {
					// Export important variables if debug is true
					if(DEBUG) {
						console.log('Debug is on, exporting variables')
						clockgl.canvas = canvas;
						clockgl.gl = gl;
						clockgl.shaderProgram = shaderProgram;
						clockgl.camera = camera;
						clockgl.projection = projection;
						clockgl.attributeLocs = attributeLocs;
						clockgl.uniformsLayout = uniformsLayout;
						clockgl.sceneUniforms = sceneUniforms;
						clockgl.meshes = meshes;
						clockgl.models = models;
					}
				})
				.done(function() {
					// Set to update the scene periodically.
					runInterval = setInterval(updateScene, 15);
				}).fail(function(e) {
					// Print error
					if(e instanceof Array && e.length > 0 && typeof(e[0]) === 'string') {
						console.error.apply(this, e);
					}
					else {
						console.error(e);
					}
				});
		}
	};

	/** Public functions
	====================	*/

	clockgl.pause = function() {
		clearInterval(runInterval);
	}
	clockgl.resume = function() {
		if(canvas) {
			runInterval = setInterval(updateScene, 15);
		}
	}
	clockgl.stop = function() {
		clockgl.pause();

		var canvasElement = canvas;

		if(meshes) {
			$.each(meshes, function(name, mesh) {
				mesh.deleteBuffers(gl);
			});
		}
		if(models) {
			$.each(models, function(name, model) {
				if(model.mesh) {
					mesh.deleteBuffers();
				}
			});
		}

		if(shaderProgram) {
			$.each(shaderProgram.trackedObject.shaders, function(index, shader) {
				clockgl.deleteShader(shader);
			});
			clockgl.deleteProgram(shaderProgram);
		}

		canvas 			= undefined;
		gl 				= undefined;
		shaderProgram 	= undefined;
		camera 			= undefined;
		projection 		= undefined;
		meshes 			= undefined;
		models 			= undefined;
		attributesLoc	= undefined;
		uniformsLayout 	= undefined;
		sceneUniforms 	= undefined;
		runInterval 	= undefined;

		return canvasElement;
	}
	clockgl.restart = function() {
		clockgl.start(clockgl.stop());
	}

	/** Private functions
	========================	*/
	clockgl._initUniformsFromContextLayout = function(uniformsContextLayout, uniformsContextDef) {
		return clockgl.mapObj(uniformsContextLayout, function(uniformDefault, name) {
			var uniformVal = uniformsContextDef[name];
			var uniform = uniformDefault.clone(uniformVal);
			return uniform;
		});
	}

	var keystrokeDebugger = function(e) { console.log(e.which); }
	var debugKeystrokes_on = false;
	clockgl._debugKeystrokes = function(val) {
		var element = document;
		if(val) {
			if(!debugKeystrokes_on) {
				$(element).keyup(keystrokeDebugger);
				debugKeystrokes_on = true;
			}
		}
		else {
			$(element).unbind('keyup', keystrokeDebugger);
			debugKeystrokes_on = false;
		}
	}

	/** Main helpers
	================	*/
	function initWebGL(canvas) {
		var webgl = null;
		var contextAttributes = {
			depth: true,
			stencil: true,
		}

		try {
			webgl = canvas.getContext('webgl', contextAttributes) || canvas.getContext('experimental-webgl', contextAttributes);
		}
		catch (e) {}

		if(!webgl) {
			console.error('Unable to intialize WebGL. Your browser may not support it.');
			return null;
		}

		return webgl;
	}

	function updateSceneUniforms() {
		// Init scene uniforms
		var sceneUniformsDef = {
			projection: projection,
			modelView: camera.modelView(),
			camPos: camera.pos,
		}
		$.extend.apply(this, [sceneUniformsDef].concat( 
			$.map(lightingDef, function(def, context) {
				return def;
			})
		));
		sceneUniforms = clockgl._initUniformsFromContextLayout(uniformsLayout.scene, sceneUniformsDef);
	}

	function updateScene() {
		try {
			handler.performActions(getInputActionsHold(), getInputActionsDown(), getInputActionsUp());
			updateSceneUniforms();

			var halfpi = Math.PI/2;
			var laxisWorld = models.laxis.world;
			var pos = lightingDef.diffuse.diffuse_cam.pos.toUnitVector();
			var ref = $V([1,0,0]);
			laxisWorld.resetRotation();
			if(ref.isAntiparallelTo(pos)) {
				laxisWorld.rotateY(Math.PI);
			}
			else {
				var angle = ref.angleFrom(pos);
				var axis = ref.cross(pos);
				laxisWorld.rotate(angle, axis);
			}

			clockgl.drawScene(gl, models, attributeLocs, sceneUniforms, uniformsLayout);
			// Export important variables if debug is true
			if(DEBUG) {
				clockgl.canvas = canvas;
				clockgl.gl = gl;
				clockgl.shaderProgram = shaderProgram;
				clockgl.camera = camera;
				clockgl.projection = projection;
				clockgl.attributeLocs = attributeLocs;
				clockgl.uniformsLayout = uniformsLayout;
				clockgl.sceneUniforms = sceneUniforms;
				clockgl.meshes = meshes;
				clockgl.models = models;
				//TEMP
				clockgl.diffuseCam = lightingDef.diffuse.diffuse_cam;
			}
		}
		catch (e) {
			console.error(e);
			clearInterval(runInterval);
		}
	}

	function getInputActionsHold() {
		return {	
			37 /*Left*/: function() {
				var axis = $L([0,camera.pos.e(2),0], [0,-1,0]);
				camera.pos = camera.pos.rotate(clockgl.radians(5), axis);
				camera.up = camera.up.rotate(clockgl.radians(5), axis).toUnitVector();
			},
			38 /*Up*/: function() {
				var ray = camera.look.subtract(camera.pos);
				var axisDir = ray.cross(camera.up).toUnitVector();
				var axis = $L([0,0,0], axisDir);
				var axisNeg = $L([0,0,0], axisDir.x(-1));
				camera.pos = camera.pos.rotate(clockgl.radians(5), axisNeg);
				camera.up = camera.up.rotate(clockgl.radians(5), axisNeg).toUnitVector();
			},
			39 /*Right*/: function() {
				var axis = $L([0,camera.pos.e(2),0], [0,1,0]);
				camera.pos = camera.pos.rotate(clockgl.radians(5), axis);
				camera.up = camera.up.rotate(clockgl.radians(5), axis).toUnitVector();
			},
			40 /*Down*/: function() {
				var ray = camera.look.subtract(camera.pos);
				var axisDir = ray.cross(camera.up).toUnitVector();
				var axis = $L([0,0,0], axisDir);
				var axisNeg = $L([0,0,0], axisDir.x(-1));
				camera.pos = camera.pos.rotate(clockgl.radians(5), axis);
				camera.up = camera.up.rotate(clockgl.radians(5), axis).toUnitVector();
			},
			65 /*W*/: function() {
				var diffuse = lightingDef.diffuse;
				var cam = diffuse.diffuse_cam;
				var axis = $L([0,cam.pos.e(2),0], [0,-1,0]);
				cam.pos = cam.pos.rotate(clockgl.radians(5), axis);
				cam.up = cam.up.rotate(clockgl.radians(5), axis).toUnitVector();
				diffuse.diffuse_dir = cam.pos.x(-1);
			},
			87 /*A*/: function() {
				var diffuse = lightingDef.diffuse;
				var cam = diffuse.diffuse_cam;
				var ray = cam.look.subtract(cam.pos);
				var axisDir = ray.cross(cam.up).toUnitVector();
				var axis = $L([0,0,0], axisDir);
				var axisNeg = $L([0,0,0], axisDir.x(-1));
				cam.pos = cam.pos.rotate(clockgl.radians(5), axisNeg);
				cam.up = cam.up.rotate(clockgl.radians(5), axisNeg).toUnitVector();
				diffuse.diffuse_dir = cam.pos.x(-1);
			},
			68 /*S*/: function() {
				var diffuse = lightingDef.diffuse;
				var cam = diffuse.diffuse_cam;
				var axis = $L([0,cam.pos.e(2),0], [0,1,0]);
				cam.pos = cam.pos.rotate(clockgl.radians(5), axis);
				cam.up = cam.up.rotate(clockgl.radians(5), axis).toUnitVector();
				diffuse.diffuse_dir = cam.pos.x(-1);
			},
			83 /*D*/: function() {
				var diffuse = lightingDef.diffuse;
				var cam = diffuse.diffuse_cam;
				var ray = cam.look.subtract(cam.pos);
				var axisDir = ray.cross(cam.up).toUnitVector();
				var axis = $L([0,0,0], axisDir);
				var axisNeg = $L([0,0,0], axisDir.x(-1));
				cam.pos = cam.pos.rotate(clockgl.radians(5), axis);
				cam.up = cam.up.rotate(clockgl.radians(5), axis).toUnitVector();
				diffuse.diffuse_dir = cam.pos.x(-1);
			},
			88 /*X*/: function() {
				if(models.xaxis)
					models.xaxis.toggleShow();
				if(models.yaxis)
					models.yaxis.toggleShow();
				if(models.zaxis)
					models.zaxis.toggleShow();
			}
		}
	}

	function getInputActionsDown() {
		return {};
	}

	function getInputActionsUp() {
		return {};
	}

}(window.clockgl = window.clockgl || {}, jQuery));