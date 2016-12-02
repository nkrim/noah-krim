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
	var meshesSrcDef = {	// Meshes source definition (key: name, value: {src[, type=Mesh][, usage=STATIC_DRAW]})
		line: {
			src: BASE+'/data/line.obj',//.json',
			type: clockgl.Mesh,
		},
	};
	/** Scene Objects
	----------------------------	*/
	var modelsDef = {		// Models definition (key: name, value: {mesh[, color=white][, world=identity][, uniformVals]})
		line0: {
			mesh: 'line',
			world: $V([0.1,0.1,0.1]),
			uniformVals: {
				''
			},
		},
	}
	/** View
	----------------------------	*/
	var background = $V([0.0, 0.0, 0.0, 1.0]);
	var fovy = 45;
	var aspect = 640.0/480.0;
	var znear = 0.1
	var zfar = 500.0
	/** Camera initials
	----------------------------	*/
	var cam_pos = $V([5.0, 5.0, 25.0]);
	var cam_look = $V([0.0, 5.0, 0.0]);
	var cam_up = $V([0.0, 1.0, 0.0]);
	/** Shader definition
	----------------------------	*/
	var vertexShaderSrc = '/src/noah-krim-clock/webgl/shaders/shader.vsh';
	var fragmentShaderSrc = '/src/noah-krim-clock/webgl/shaders/shader.fsh';
	var attributeNames = ['position', 'color'];
	var uniformsLayoutDef = {
		scene: {
			projection: 	clockgl.UNIFORM.MAT4F, 
			modelView: 		clockgl.UNIFORM.MAT4F,
			camPos: 		clockgl.UNIFORM.VEC3F,
			diffuse_dir: 	clockgl.UNIFORM.VEC3F,
			diffuse_col: 	clockgl.UNIFORM.VEC4F,
			diffuse_int: 	clockgl.UNIFORM.VEC1F,
		},
		model: {
			world: 			clockgl.UNIFORM.VEC3F,
		},
		mesh: {
			diffuse_on: 	clockgl.UNIFORM.VEC1I;
		},
	}
	/** Global lighting
	----------------------------	*/
	var lightingDef = {
		diffuse: {
			diffuse_dir: , 'diffuse_col', 'diffuse_int'],

		}
	}

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
						console.log(attributes);

						// Create projection/modelView matrices
						projection = makeprojection(fovy, aspect, znear, zfar);

						// Get uniform locations
						uniformsLayout = {};
						$.each(uniformsLayoutDef, function(context, uniformsDef) {
							uniformsLayout[context] = $.mapObj(uniformsDef, function(name, type) {
								var loc = gl.getUniformLocation(shaderProgram, name);
								return new clockgl.Uniform(type, loc);
							});
						});
						var sceneUniformsDef = {
							projection: projection,
							modelView: camera.mat,
							camPos: camera.pos,
							diffuse_dir: 
						}
						sceneUniforms = {};
						uniformsLayout.projection = clockgl.uniformFromProgram(gl, clockgl.UNIFORM.MAT4F, shaderProgram, 'projection', projection);
						// Get world uniform location
						worldUniform = gl.getUniformLocation(shaderProgram, 'world');
						console.log(uniforms);
					}
					catch (e) {
						return $.Deferred().reject(e);
					}
				});

			// Meshes/Models deferred actions
			//var meshesDeferred = clockgl.loadMeshes(gl, meshesSrcDef)
			var meshesDeferred = clockgl.loadMeshesFromLoader(gl, 
					clockgl.mapObj(meshesSrcDef, function(opt) {
						return opt.src;
					})
				).then(function(m) {
					try {
						// Set the models dictionary
						meshes = m;
						console.log(meshes);

						// Construct models from modelsDef
						models = clockgl.mapObj(modelsDef, function(opt) {
							return new clockgl.Model(gl, meshes[opt.mesh], opt.color, opt.world);
						});

						// Construct axes
						var axisUniforms = {}
						models.xaxis = clockgl.lineModel(gl, $V([0.0, 0.0, 0.0]), $V([100.0, 0.0, 0.0]), $V([1.0, 0.0, 0.0]), axisUniforms);
						models.yaxis = clockgl.lineModel(gl, $V([0.0, 0.0, 0.0]), $V([0.0, 100.0, 0.0]), $V([0.0, 1.0, 0.0]), axisUniforms);
						models.zaxis = clockgl.lineModel(gl, $V([0.0, 0.0, 0.0]), $V([0.0, 0.0, 100.0]), $V([0.0, 0.0, 1.0]), axisUniforms);
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
						clockgl.modelView = modelView;
						clockgl.attributeLocs = attributeLocs;
						clockgl.uniformLocs = uniformLocs;
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
		camera 			= undefined;
		shaderProgram 	= undefined;
		meshes 			= undefined;
		models 			= undefined;
		projection 	= undefined;
		modelView 		= undefined;
		attributes 		= undefined;
		uniforms 		= undefined;
		worldUniform 	= undefined;
		runInterval 	= undefined;

		return canvasElement;
	}
	clockgl.restart = function() {
		clockgl.start(clockgl.stop());
	}

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

	function updateScene() {
		try {
			uniforms.modelView = camera.mat;
			clockgl.drawScene(gl, models, attributeLocs, uniforms, worldUniform);
		}
		catch (e) {
			console.error(e);
			clearInterval(runInterval);
		}
	}

}(window.clockgl = window.clockgl || {}, jQuery));