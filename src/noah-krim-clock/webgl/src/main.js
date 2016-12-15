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
	/** Meshes
	----------------------------	*/
	var meshesSrcDef = {	// Meshes source definition (key: name, value: {src[, type=Mesh][, uniforms={}][, usage=STATIC_DRAW]})
		line: {
			src: BASE+'/data/LineSmall.obj',
			uniforms: {
				lighting_on: clockgl.UNIFORM_TRUE,
			},
		},
		clockFrame: {
			src: BASE+'/data/ClockFrame.obj',
			uniforms: {
				lighting_on: clockgl.UNIFORM_TRUE,
			},
		},
		clockFace: {
			src: BASE+'/data/ClockFace.obj',
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
				end: $V([Math.pow(2,14), 0.0, 0.0]),
			},
			uniforms: {
				lighting_on: clockgl.UNIFORM_FALSE,
			},
		},
	};
	/** Scene Objects
	----------------------------	*/
	/** SceneObjs definition ({	name: {
									models: { 
										name: { mesh[, color=white][, world={base,scale,rot,trans}][, uniforms][, colorUsage][, options={}] }
									}
									[,world: { base, scale, rot, trans }]
									[,optionsLayout: { Default values to assign as model options }]
									[,uniforms]
									[,update: func(time)]
								}) */
	var sceneObjsDef = {	
		// Axes	
		axes: {
			models: {
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
			},
		},
		// Sourced
		clock0: {
			models: {
				lineLong: {
					mesh: 'line',
					color: $V([0.9, 0.9, 0.9, 1.0]),
					uniforms: {
						specular_exp: $V([2]),
					},
					world: {
						//base: new clockgl.World(null, null, null, $V([0, 2, 0])),
						scale: $V([0.85, 0.95, 0.85]),
					},
				},
				lineShort: {
					mesh: 'line',
					color: $V([0.9, 0.9, 0.9, 1.0]),
					uniforms: {
						specular_exp: $V([2]),
					},
					world: {
						scale: $V([0.85, 0.8, 0.85]),
						rot: Matrix.RotationZ(-clockgl.radians(60)), 
					},
				},
				clockFrame: {
					mesh: 'clockFrame',
					color: $V([0.9, 0.9, 0.9, 1.0]),
					uniforms: {
						specular_exp: $V([2]),
					},
					world: {
						
					},
				},
				clockFace: {
					mesh: 'clockFace',
					color: $V([0.2, 0.2, 0.2, 1.0]),
					uniforms: {
						specular_exp: $V([16]),
						specular_int: $V([0.5]),
					},
					world: {
						
					},
				},
			},
			world: {
				scale: $V([0.1, 0.1, 0.1]),
			},
			update: function(timeDiff) {
				var secondsSpeed = -timeDiff * Math.PI / 500;
				this.models.lineShort.model.world.rotateZ(secondsSpeed);
				this.models.lineLong.model.world.rotateZ(secondsSpeed / 6);
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
	var cam_pos = $V([15.0, 10.0, 40.0]);
	var cam_look = $V([0.0, 0.0, 0.0]);
	var cam_up = $V([0.0, 1.0, 0.0]);
	/** Global lighting
	----------------------------	*/
	var lightingDef = {
		ambient: {
			ambient_col: $V([1.0, 1.0, 1.0]),
			ambient_int: $V([0.3]),
		},
		diffuse: {
			diffuse_cam: new clockgl.Camera($V([-1,1,1]),$V([0,0,0])), //TEMP
			diffuse_dir: $V([1.0, -.0, -1.0]).toUnitVector(),
			diffuse_col: $V([1.0, 1.0, 1.0]), 
			diffuse_int: $V([0.4]),
		},
		specular: {
			specular_col: $V([1.0, 1.0, 1.0]),
			specular_int_default: $V([0.4]),
		},
	};
	/** Shader definition
	----------------------------	*/
	var shaderProgramsDef = {
		draw: {
			vsh: '/src/noah-krim-clock/webgl/shaders/draw.vsh',
			fsh: '/src/noah-krim-clock/webgl/shaders/draw.fsh',
			attributes: ['position', 'normal', 'color'],
			uniforms: {
				scene: {
					projection: 	{
						type: clockgl.UNIFORM.MAT4F,
						default: makePerspective(fovy, aspect, znear, zfar),
					},
					modelView: 		{
						type: clockgl.UNIFORM.MAT4F,
						default: Matrix.I(4),
					},
					camPos: 	{
						type: clockgl.UNIFORM.VEC3F,
						default: cam_pos,
					},
					ambient_col: 	{
						type: clockgl.UNIFORM.VEC3F,
						default: lightingDef.ambient.ambient_col,
					},
					ambient_int: 	{
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
					specular_col: {
						type: clockgl.UNIFORM.VEC3F,
						default: lightingDef.specular.specular_col,
					},
				},
				sceneObj: {
					objWorld: {
						type: clockgl.UNIFORM.MAT4F,
						default: Matrix.I(4),
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
					specular_exp: 	{
						type: clockgl.UNIFORM.VEC1F,
						default: $V([0]),
					},
					specular_int: 	{
						type: clockgl.UNIFORM.VEC1F,
						default: lightingDef.specular.specular_int_default,
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
					specular_on: 	{
						type: clockgl.UNIFORM.VEC1I,
						default: clockgl.UNIFORM_TRUE,
					},
				},
			},
		},
	}

	/**	Private variables
	============================	*/
	/**	Context variables
	----------------------------	*/
	var canvas;
	var gl;
	/** Shader programs
	----------------------------	*/
	var shaderPrograms;
	var curProgram;
	/** View variables
	----------------------------	*/
	var camera;
	var projection;
	/** Mesh/SceneObj variables
	----------------------------	*/
	var meshes;
	var sceneObjs;
	/** Uniforms and locations
	----------------------------	*/
	var uniformsForce;
	var sceneUniforms;
	/** Run instance
	----------------------------	*/
	var runInterval;
	var prevTime;
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
			var shaderDeferred = clockgl.loadShaderPrograms(gl, shaderProgramsDef)
				.then(function(sps) {
					try {
						// Set the shaderProgram
						shaderPrograms = sps;

						// Create projection/modelView matrices
						projection = makePerspective(fovy, aspect, znear, zfar);

						// Uniforms actions
						uniformsForce = {scene: {}, sceneObj: {}, model: {}, mesh: {}};
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
						sceneObjs = clockgl.mapObj(sceneObjsDef, function(so) {
							var models = {};
							var modelsOptionsDef = {};
							$.each(so.models || {}, function(name, mo) {
								var world = mo.world ? 
												new clockgl.World(mo.world.base, mo.world.scale, mo.world.rotation || mo.world.rot, mo.world.translation || mo.world.trans) 
												: undefined;
								models[name] = new clockgl.Model(gl, meshes[mo.mesh], mo.color, world, mo.uniforms, mo.colorUsage);
								if(mo.options)
									modelsOptionsDef[name] = mo.options;
							});
							var world = so.world ? 
											new clockgl.World(so.world.base, so.world.scale, so.world.rotation || so.world.rot, so.world.translation || so.world.trans) 
											: undefined;
							var obj = new clockgl.SceneObj(models, world, so.optionsLayout, modelsOptionsDef, so.uniforms, so.update);
							return obj;
						});
						console.log(sceneObjs);
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
						clockgl.shaderPrograms = shaderPrograms;
						clockgl.camera = camera;
						clockgl.projection = projection;
						clockgl.sceneUniforms = sceneUniforms;
						clockgl.meshes = meshes;
						clockgl.sceneObjs = sceneObjs;
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
		if(sceneObjs) {
			$.each(sceneObjs, function(name, so) {
				$.each(sceneObjs.models, function(name, mo) {
					if(mo.model.mesh) {
						mo.model.deleteBuffers(gl);
					}
				})
			});
		}

		if(shaderPrograms) {
			$.each(shaderPrograms, function(name, cp) {
				cp.delete(gl);
			});
		}

		canvas 			= undefined;
		gl 				= undefined;
		shaderPrograms 	= undefined;
		camera 			= undefined;
		projection 		= undefined;
		meshes 			= undefined;
		sceneObjs		= undefined;
		sceneUniforms 	= undefined;
		runInterval 	= undefined;

		return canvasElement;
	}
	clockgl.restart = function() {
		clockgl.start(clockgl.stop());
	}

	/** Private functions
	========================	*/
	clockgl._initUniformsFromContextLayout = function(uniformsContextLayout, uniformsContextDef, uniformsContextForce) {
		return clockgl.mapObj(uniformsContextLayout, function(uniformDefault, name) {
			var uniformVal = uniformsContextForce[name] || uniformsContextDef[name];
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

	function getSceneUniformsDef() {
		// Init scene uniforms
		var sceneUniformsDef = {
			projection: projection,
			modelView: camera.modelView(),
			camPos: camera.pos,
			specular_half: clockgl.halfAngleDir(camera.lookVector(), lightingDef.diffuse.diffuse_cam.lookVector()).x(-1),
		}
		lightingDef.diffuse.diffuse_dir = lightingDef.diffuse.diffuse_cam.lookVector();
		$.extend.apply(this, [sceneUniformsDef].concat( 
			$.map(lightingDef, function(def, context) {
				return def;
			})
		));
		return sceneUniformsDef;
	}

	function updateScene() {
		try {
			// Set time vars
			var curTime = new Date();
			if(!prevTime)
				prevTime = curTime;
			var timeDiff = curTime - prevTime;

			// Perform keyboard actions
			handler.performActions(getInputActionsHold(curTime), getInputActionsDown(curTime), getInputActionsUp(curTime));

			// TEMP Diffuse lighting stuff
			var halfpi = Math.PI/2;
			var laxisWorld = sceneObjs.axes.models.laxis.model.world;
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

			// Draw scene
			clockgl.drawScene(gl, sceneObjs, timeDiff, shaderPrograms, getSceneUniformsDef(), uniformsForce);

			// Set prevTime
			prevTime = curTime;

			// Export important variables if debug is true
			if(DEBUG) {
				clockgl.canvas = canvas;
				clockgl.gl = gl;
				clockgl.shaderPrograms = shaderPrograms;
				clockgl.camera = camera;
				clockgl.projection = projection;
				clockgl.sceneUniforms = sceneUniforms;
				clockgl.meshes = meshes;
				clockgl.sceneObjs = sceneObjs;
				//TEMP
				clockgl.diffuseCam = lightingDef.diffuse.diffuse_cam;
			}
		}
		catch (e) {
			console.error(e);
			clearInterval(runInterval);
		}
	}

	function getInputActionsHold(curTime) {
		var horizontalSensitivity = clockgl.radians(5);
		var verticalSensitivity = clockgl.radians(5);
		var zoomSensitivity = 1
		return {	
			37 /* Left */: function() {
				camera.rotateAround(-horizontalSensitivity, Vector.j);
			},
			38 /* Up */: function() {
				camera.rotateAroundVert(-verticalSensitivity);
			},
			39 /* Right */: function() {
				camera.rotateAround(horizontalSensitivity, Vector.j);
			},
			40 /* Down */: function() {
				camera.rotateAroundVert(verticalSensitivity);
			},
			65 /* A */: function() {
				var diffuse = lightingDef.diffuse;
				diffuse.diffuse_cam.rotateAround(-horizontalSensitivity, Vector.j);
			},
			87 /* W */: function() {
				var diffuse = lightingDef.diffuse;
				diffuse.diffuse_cam.rotateAroundVert(-verticalSensitivity);
			},
			68 /* D */: function() {
				var diffuse = lightingDef.diffuse;
				diffuse.diffuse_cam.rotateAround(horizontalSensitivity, Vector.j);
			},
			83 /* S */: function() {
				var diffuse = lightingDef.diffuse;
				diffuse.diffuse_cam.rotateAroundVert(verticalSensitivity);
			},
			107 /* + */: function() {
				camera.zoom(zoomSensitivity);
			},
			109 /* - */: function() {
				camera.zoom(-zoomSensitivity);
			},
		}
	}

	function getInputActionsDown(curTime) {
		return {};
	}

	function getInputActionsUp(curTime) {
		return {
			76 /* L */: function() {
				if(uniformsForce.mesh.lighting_on)
					uniformsForce.mesh.lighting_on.elements[0] ^= 1;
				else
					uniformsForce.mesh.lighting_on = clockgl.UNIFORM_FALSE;
			},
			88 /* X */: function() {
				var axes = sceneObjs.axes.models;
				if(axes.xaxis)
					axes.xaxis.hide = !axes.xaxis.hide;
				if(axes.yaxis)
					axes.yaxis.hide = !axes.yaxis.hide;
				if(axes.zaxis)
					axes.zaxis.hide = !axes.zaxis.hide;
				if(axes.laxis)
					axes.laxis.hide = !axes.laxis.hide;
			},
		};
	}

}(window.clockgl = window.clockgl || {}, jQuery));