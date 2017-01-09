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
		hand: {
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
	var meshesRawDef = {	
		// Raw definitions for meshes (key: name, value: {init, options, uniforms}) 
		// [Raw mesh `init` function: function(gl, options, meshUniformsDef)]
		quad: {
			init: clockgl.rawQuadMesh,
			options: {
				topLeft: $V([-1.0, 1.0, 0.0]),
				topRight: $V([1.0, 1.0, 0.0]),
				bottomRight: $V([1.0, -1.0, 0.0]),
				bottomLeft: $V([-1.0, -1.0, 0.0]),
			},
			uniforms: {
				lighting_on: clockgl.UNIFORM_FALSE,
			},
		},
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
		// Quad
		quad: {
			models: {
				quad: {
					mesh: 'quad',
				},
			},
		},
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
		/*// Sourced
		clock0: {
			models: {
				lineLong: {
					mesh: 'hand',
					color: $V([0.9, 0.9, 0.9, 1.0]),
					uniforms: {
						specular_exp: $V([1]),
						specular_int: $V([0.3]),
					},
					world: {
						//base: new clockgl.World(null, null, null, $V([0, 2, 0])),
						scale: $V([0.85, 0.95, 0.5]),
						trans: $V([0.0, 0.0, 1.0]),
					},
				},
				lineShort: {
					mesh: 'hand',
					color: $V([0.9, 0.9, 0.9, 1.0]),
					uniforms: {
						specular_exp: $V([1]),
						specular_int: $V([0.3]),
					},
					world: {
						scale: $V([0.85, 0.8, 0.5]),
						rot: Matrix.RotationZ(-clockgl.radians(60)),
						trans: $V([0.0, 0.0, 6.0]),
					},
				},
				clockFrame: {
					mesh: 'clockFrame',
					color: $V([0.9, 0.9, 0.9, 1.0]),
					uniforms: {
						specular_exp: $V([4]),
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
		},*/
	};
	var drawingObjsDef = ['axes', /^clock\d+L\d+$/];
	/** Clock Objects
	----------------------------	*/
	var clockLayersDef = {
		// Clock def
		world: new clockgl.World(null, $V([0.03, 0.03, 0.03])),
		uniforms: {},
		// Layers def
		layers: [1, 6, 12],
		layerDistance: 9.0,
		initDistance: 0.0,
		clockInitAngle: 0.0,
	};
	/** View
	----------------------------	*/
	var background = $V([0.0, 0.0, 0.0, 1.0]);
	var fovy = 45;
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
			ambient_int: $V([0.1]),
		},
		diffuse: {
			diffuse_cam: new clockgl.Camera($V([-10,10,10]),$V([0,0,0])), //TEMP
			diffuse_dir: $V([1.0, -1.0, -1.0]).toUnitVector(),
			diffuse_col: $V([1.0, 1.0, 1.0]), 
			diffuse_int: $V([0.7]),
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
			vsh: BASE+'/shaders/draw.vsh',
			fsh: BASE+'/shaders/draw.fsh',
			attributes: ['position', 'normal', 'color'],
			uniforms: {
				scene: {
					projection: 	{ type: clockgl.UNIFORM.MAT4F, default: Matrix.I(4), },
					modelView: 		{ type: clockgl.UNIFORM.MAT4F, default: Matrix.I(4), },
					lightProj: 		{ type: clockgl.UNIFORM.MAT4F, default: Matrix.I(4), },
					lightView:  	{ type: clockgl.UNIFORM.MAT4F, default: Matrix.I(4), },
					camPos: 		{ type: clockgl.UNIFORM.VEC3F, default: cam_pos, },
					vsm_tex: 		{ type: clockgl.UNIFORM.VEC1I, default: $V([0]), },
					ambient_col: 	{ type: clockgl.UNIFORM.VEC3F, default: lightingDef.ambient.ambient_col, },
					ambient_int: 	{ type: clockgl.UNIFORM.VEC1F, default: lightingDef.ambient.ambient_int, },
					diffuse_dir: 	{ type: clockgl.UNIFORM.VEC3F, default: lightingDef.diffuse.diffuse_dir, }, 
					diffuse_col: 	{ type: clockgl.UNIFORM.VEC3F, default: lightingDef.diffuse.diffuse_col, },
					diffuse_int: 	{ type: clockgl.UNIFORM.VEC1F, default: lightingDef.diffuse.diffuse_int, },
					specular_col: 	{ type: clockgl.UNIFORM.VEC3F, default: lightingDef.specular.specular_col, },
				},
				sceneObj: {
					objWorld: 		{ type: clockgl.UNIFORM.MAT4F, default: Matrix.I(4), },
				},
				model: {
					base: 			{ type: clockgl.UNIFORM.MAT4F, default: Matrix.I(4), },
					scale: 			{ type: clockgl.UNIFORM.MAT4F, default: Matrix.I(4), },
					rotation: 		{ type: clockgl.UNIFORM.MAT4F, default: Matrix.I(4), },
					translation: 	{ type: clockgl.UNIFORM.MAT4F, default: Matrix.I(4), },
					specular_exp: 	{ type: clockgl.UNIFORM.VEC1F, default: $V([0]), },
					specular_int: 	{ type: clockgl.UNIFORM.VEC1F, default: lightingDef.specular.specular_int_default, },
				},
				mesh: {
					lighting_on: 	{ type: clockgl.UNIFORM.VEC1I, default: clockgl.UNIFORM_FALSE, },
					ambient_on: 	{ type: clockgl.UNIFORM.VEC1I, default: clockgl.UNIFORM_TRUE, },
					diffuse_on: 	{ type: clockgl.UNIFORM.VEC1I, default: clockgl.UNIFORM_TRUE, },
					specular_on: 	{ type: clockgl.UNIFORM.VEC1I, default: clockgl.UNIFORM_TRUE, },
					vsm_on: 		{ type: clockgl.UNIFORM.VEC1I, default: clockgl.UNIFORM_TRUE, },
				},
			},
		},
		blur: {
			vsh: BASE+'/shaders/quad_t.vsh',
			fsh: BASE+'/shaders/blur.fsh',
			attributes: ['position'],
			uniforms: {
				scene: {
					resolution: 	{ type: clockgl.UNIFORM.VEC1I, default: $V([0]), },
					blur_sigma: 	{ type: clockgl.UNIFORM.VEC1F, default: $V([0]), },
					is_vertical: 	{ type: clockgl.UNIFORM.VEC1I, default: $V([0]), },
					img_tex: 		{ type: clockgl.UNIFORM.VEC1I, default: $V([0]), },
				},
				sceneObj: { },
				model: { },
				mesh: { },
			},
		},
		copy: {
			vsh: BASE+'/shaders/quad_t.vsh',
			fsh: BASE+'/shaders/quad_t.fsh',
			attributes: ['position'],
			uniforms: {
				scene: {
					img_tex: 		{ type: clockgl.UNIFORM.VEC1I, default: $V([0]), },
				},
				sceneObj: { },
				model: { },
				mesh: { },
			},
		},
		sat: {
			vsh: BASE+'/shaders/quad.vsh',
			fsh: BASE+'/shaders/sat.fsh',
			attributes: ['position'],
			uniforms: {
				scene: {
					img_tex: 		{ type: clockgl.UNIFORM.VEC1I, default: $V([0]), },
				},
				sceneObj: { },
				model: { },
				mesh: { },
			},
		},
		sat_m: {
			vsh: BASE+'/shaders/quad.vsh',
			fsh: BASE+'/shaders/sat_m.fsh',
			attributes: ['position'],
			uniforms: {
				scene: {
					img_tex: 		{ type: clockgl.UNIFORM.VEC1I, default: $V([0]), },
				},
				sceneObj: { },
				model: { },
				mesh: { },
			},
		},
		vsm: {
			vsh: BASE+'/shaders/vsm.vsh',
			fsh: BASE+'/shaders/vsm.fsh',
			attributes: ['position'],
			uniforms: {
				scene: {
					projection: 	{ type: clockgl.UNIFORM.MAT4F, default: Matrix.I(4), },
					modelView: 		{ type: clockgl.UNIFORM.MAT4F, default: Matrix.I(4), },
				},
				sceneObj: {
					objWorld: 		{ type: clockgl.UNIFORM.MAT4F, default: Matrix.I(4), },
				},
				model: {
					base: 			{ type: clockgl.UNIFORM.MAT4F, default: Matrix.I(4), },
					scale: 			{ type: clockgl.UNIFORM.MAT4F, default: Matrix.I(4), },
					rotation: 		{ type: clockgl.UNIFORM.MAT4F, default: Matrix.I(4), },
					translation: 	{ type: clockgl.UNIFORM.MAT4F, default: Matrix.I(4), },
				},
				mesh: { },
			},
		},
	};

	/**	Private variables
	============================	*/
	/**	Context variables
	----------------------------	*/
	var canvas;
	var gl;
	var aspect;
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
	var drawingObjs;
	/** Uniforms and locations
	----------------------------	*/
	var uniformsForce;
	var sceneUniforms;
	/** Lighting definition
	----------------------------	*/
	var lightingDef;
	/** Run instance
	----------------------------	*/
	var runInterval;
	var options;
	var prevTime;
	var fps;
	var averageFps;
	var frames;
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
			// Expose gl extensions
			gl.getExtension('OES_standard_derivatives');

			// Set gl defaults
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

			// Set projection (via resize() function)
			clockgl.resize();

			// Shaders deferred actions
			var shaderDeferred = clockgl.loadShaderPrograms(gl, shaderProgramsDef)
				.then(function(sps) {
					try {
						// Set the shaderProgram
						shaderPrograms = sps;

						// Uniforms actions
						uniformsForce = {scene: {}, sceneObj: {}, model: {}, mesh: {}};

						console.log(shaderPrograms);
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
						sceneObjs = initSceneObjs(gl, meshes, sceneObjsDef);

						// Construct clock layers
						var clocks = initClockObjs(gl, meshes, clockLayersDef);
						$.extend(sceneObjs, clocks);

						// Find and set drawingObjs array
						drawingObjs = initDrawingObjs(drawingObjsDef, sceneObjs);

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
						clockgl.drawingObjs = drawingObjs;
					}
				})
				.done(function() {
					// Set to update the scene periodically.
					options = {cur: {}, old: {}};
					averageFps = 0;
					frames = 0;
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

	clockgl.resize = function() {
		if(!canvas)
			return;
		var aspect = canvas.width/canvas.height;
		projection = makePerspective(fovy, aspect, znear, zfar);
	}

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
			shaderPrograms.delete(gl);
		}

		canvas 			= undefined;
		gl 				= undefined;
		shaderPrograms 	= undefined;
		camera 			= undefined;
		projection 		= undefined;
		meshes 			= undefined;
		sceneObjs		= undefined;
		sceneUniforms 	= undefined;
		lightingDef 	= undefined;
		runInterval 	= undefined;
		options 		= undefined;
		fps 			= undefined;
		averageFps 		= undefined;
		frames 			= undefined;

		return canvasElement;
	}
	clockgl.restart = function() {
		clockgl.start(clockgl.stop());
	}

	clockgl.info = function() {
		console.log('fps: %d\naverageFps: %d\nframes: %d', fps, averageFps, frames);
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

	clockgl._viewportToCanvas = function(gl) {
		if(canvas)
			gl.viewport(0, 0, canvas.width, canvas.height);
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
			stencil: true,
		}

		try {
			webgl =	   canvas.getContext('webgl2', contextAttributes) 
					|| canvas.getContext('webgl', contextAttributes) 
					|| canvas.getContext('experimental-webgl', contextAttributes);
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
		var lightProj = makeOrtho(-30, 30, -30, 30, 0, 40);
		var lightView = lightingDef.diffuse.diffuse_cam.modelView();
		var sceneUniformsDef = {
			draw: {
				projection: projection,
				modelView: camera.modelView(),
				lightProj: lightProj,
				lightView: lightView,
				camPos: camera.pos,
				specular_half: clockgl.halfAngleDir(camera.lookVector(), lightingDef.diffuse.diffuse_cam.lookVector()).x(-1),
			},
			blur: { },
			copy: { },
			sat: { },
			sat_m: { },
			vsm: {
				projection: lightProj,
				modelView: lightView,
			},
		}
		lightingDef.diffuse.diffuse_dir = lightingDef.diffuse.diffuse_cam.lookVector();
		$.extend.apply(this, [sceneUniformsDef.draw].concat( 
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

			fps = 1000/timeDiff;
			averageFps = (averageFps*frames + fps)/(++frames);

			// Move current options to old
			$.extend(options.old, options.cur);
			options.cur = {};

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
			clockgl.drawScene(gl, sceneObjs, drawingObjs, timeDiff, options, shaderPrograms, getSceneUniformsDef(), uniformsForce);

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
				clockgl.lightingDef = lightingDef;
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

	function initSceneObjs(gl, meshes, sceneObjsDef) {
		return clockgl.mapObj(sceneObjsDef, function(so) {
			var models = {};
			var modelsOptionsDef = {};

			$.each(so.models || {}, function(name, mo) {
				var world = mo.world;
				if(world && !(world instanceof clockgl.World))
					world = new clockgl.World(world.base, world.scale, world.rot, world.trans);
				models[name] = new clockgl.Model(gl, meshes[mo.mesh], mo.color, world, mo.uniforms, mo.colorUsage);
				if(mo.options)
					modelsOptionsDef[name] = mo.options;
			});

			var world = so.world;
			if(world && !(world instanceof clockgl.World))
				world = new clockgl.World(world.base, world.scale, world.rot, world.trans);
			var obj = new clockgl.SceneObj(models, world, so.optionsLayout, modelsOptionsDef, so.uniforms, so.update);

			return obj;
		});
	}

	function initDrawingObjs(drawingObjsDef, sceneObjs) {
		var ret = {};
		$.each(sceneObjs, function(name) {
			var found = false;
			for(var i=0; !found && i<drawingObjsDef.length; i++) {
				var cur = drawingObjsDef[i];
				if(typeof(cur) === 'string' || cur instanceof String)
					found = cur == name;
				else if(cur instanceof RegExp)
					found = cur.test(name);
			}
			if(found)
				ret[name] = true;
		});
		return ret;
	}

	function initClockObjs(gl, meshes, clockLayersDef) {
		// Assign defaults
		var world = clockLayersDef.world || new clockgl.World();
		var uniformsDef = clockLayersDef.uniforms || {};
		var layers = clockLayersDef.layers || [];

		// Construct clocks
		// args: (gl, meshes.hand, meshes.clockFrame, meshes.clockFace, clockLayersDef.world, clockLayersDef.uniforms)
		var layers = $.map(clockLayersDef.layers, function(count) {
			var layer = [];
			for(var i=0; i<count; i++)
				layer.push(new clockgl.ClockObj(gl, meshes.hand, meshes.clockFrame, meshes.clockFace, world.clone(), uniformsDef))
			return [layer];
		});

		// Arrange in layers
		return clockgl.initCircularLayers('clock', layers, clockLayersDef.layerDistance, clockLayersDef.initDistance, clockLayersDef.initAngle);
	}


	/** Input handlers
	====================	*/

	function getInputActionsHold(curTime) {
		var horizontalSensitivity = clockgl.radians(2);
		var verticalSensitivity = clockgl.radians(2);
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
			187 /* + */: function() {
				camera.zoom(zoomSensitivity);
			},
			189 /* - */: function() {
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
				options.cur.hideAxes = !options.old.hideAxes;
			},
		};
	}

}(window.clockgl = window.clockgl || {}, jQuery));