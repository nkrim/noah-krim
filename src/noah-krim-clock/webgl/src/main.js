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
			src: BASE+'/data/line.obj',//.json',
			type: clockgl.Mesh,
			uniforms: {
				diffuse_on: clockgl.UNIFORM_FALSE,
			},
		},
	};
	var meshesRawDef = {	// Raw definitions for meshes (key: name, value: {init, options, uniforms}) [Raw mesh `init` function: functoin(gl, options, meshUniformsDef)]
		xaxis: {
			init: clockgl.rawSingleLineMesh,
			options: {
				start: $V([0.0, 0.0, 0.0]),
				end: $V([100.0, 0.0, 0.0]),
			},
			uniforms: {
				diffuse_on: clockgl.UNIFORM_FALSE,
			},
		},
		yaxis: {
			init: clockgl.rawSingleLineMesh,
			options: {
				start: $V([0.0, 0.0, 0.0]),
				end: $V([0.0, 100.0, 0.0]),
			},
			uniforms: {
				diffuse_on: clockgl.UNIFORM_FALSE,
			},
		},
		zaxis: {
			init: clockgl.rawSingleLineMesh,
			options: {
				start: $V([0.0, 0.0, 0.0]),
				end: $V([0.0, 0.0, 100.0]),
			},
			uniforms: {
				diffuse_on: clockgl.UNIFORM_FALSE,
			},
		},
	};
	/** Scene Objects
	----------------------------	*/
	var modelsDef = {		// Models definition (key: name, value: {mesh[, color=white][, world=identity][, uniforms={}]})
		// Axes
		xaxis: {
			mesh: 'xaxis',
			color: $V([1.0, 0.0, 0.0, 1.0]),
		},
		yaxis: {
			mesh: 'yaxis',
			color: $V([0.0, 1.0, 0.0, 1.0]),
		},
		zaxis: {
			mesh: 'zaxis',
			color: $V([0.0, 0.0, 1.0, 1.0]),
		},
		// Sourced
		line0: {
			mesh: 'line',
			color: $V([1.0, 1.0, 1.0, 1.0]),
			world: Matrix.I(4).multiply(Matrix.Diagonal([0.1,0.1,0.1,1])).multiply(Matrix.RotationX(clockgl.radians(30)).ensure4x4()).multiply(Matrix.Translation($V([20,20,20]))),
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
	var cam_pos = $V([5.0, 5.0, 25.0]);
	var cam_look = $V([0.0, 5.0, 0.0]);
	var cam_up = $V([0.0, 1.0, 0.0]);
	/** Global lighting
	----------------------------	*/
	var lightingDef = {
		diffuse: {
			diffuse_dir: $V([-2.0, 15.0, 5.0]),
			diffuse_col: $V([1.0, 1.0, 1.0]), 
			diffuse_int: $V([1.0]),
		}
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
			world: 			{
				type: clockgl.UNIFORM.MAT4F,
				default: Matrix.I(4),
			},
		},
		mesh: {
			diffuse_on: 	{
				type: clockgl.UNIFORM.VEC1I,
				default: clockgl.UNIFORM_FALSE,
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
							return new clockgl.Model(gl, meshes[opt.mesh], opt.color, opt.world);
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

	/** Main helpers
	================	*/
	function initWebGL(canvas) {
		var webgl = null;

		try {
			webgl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
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
		sceneUniforms = clockgl._initUniformsFromContextLayout(uniformsLayout.scene, sceneUniformsDef);
	}

	function updateScene() {
		try {
			updateSceneUniforms();
			clockgl.drawScene(gl, models, attributeLocs, sceneUniforms, uniformsLayout);
		}
		catch (e) {
			console.error(e);
			clearInterval(runInterval);
		}
	}

}(window.clockgl = window.clockgl || {}, jQuery));