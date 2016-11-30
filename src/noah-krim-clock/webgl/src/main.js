/**
	main.js: main interface to coordinate webgl actions for the noah-krim-clock polymer element
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** Preset variables
	============================	*/
	/** Context
	----------------------------	*/
	var BASE = '/src/noah-krim-clock/webgl';	// Base URL
	/** Models
	----------------------------	*/
	var meshesSrcDef = {	// Meshes source definition (key: name, value: {src[, type=Mesh][, usage=STATIC_DRAW]})
		line: {
			src: BASE+'/data/line.json',
			type: clockgl.Mesh,
		},
	};
	/** Scene Objects
	----------------------------	*/
	var modelsDef = {		// Models definition (key: name, value: {mesh[, color=white][, world=identity]})
		line0: {
			mesh: 'line',
			world: Matrix.I(4).multiply(0.1),
		},
	}
	/** View
	----------------------------	*/
	var background = $V([0.0, 0.0, 0.0, 1.0]);
	var fovy = 45;
	var aspect = 640.0/480.0;
	var znear = 0.1
	var zfar = 500.0
	var modelViewLookAt = $M([   0.0,   5.0,  25.0,
		                         0.0,   5.0,   0.0,
		                         0.0,   1.0,   0.0]);
	/** Shader definition
	----------------------------	*/
	var vertexShaderSrc = '/src/noah-krim-clock/webgl/shaders/shader.vsh';
	var fragmentShaderSrc = '/src/noah-krim-clock/webgl/shaders/shader.fsh';
	var attributeNames = ['position', 'color'];

	/**	Private variables
	============================	*/
	/**	Context variables
	----------------------------	*/
	var canvas;
	var gl;
	/** Shader programs
	----------------------------	*/
	var shaderProgram;
	/** Model/SceneObj variables
	----------------------------	*/
	var meshes;
	var models;
	/** View matrices
	----------------------------	*/
	var perspective;
	var modelView;
	/** Attribute locations
	----------------------------	*/
	var attributes;
	/** Uniform locations
	----------------------------	*/
	var uniforms;
	var worldUniform;
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
			//gl.enable(gl.DEPTH_TEST);           // Enable depth testing
			gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

			// Shaders deferred actions
			var shaderDeferred = clockgl.initShaderProgram(gl, vertexShaderSrc, fragmentShaderSrc)
				.done(function(sp) {
					// Set the shaderProgram
					shaderProgram = sp;

					// Initialize the shaders
					gl.useProgram(shaderProgram);

					// Get and enable attribute locations
					attributes = {};
					$.each(attributeNames, function(index, name) {
						var loc = gl.getAttribLocation(shaderProgram, name);
						gl.enableVertexAttribArray(loc);
						attributes[name] = loc;
					});
					console.log(attributes);

					// Create perspective/modelView matrices
					perspective = makePerspective(fovy, aspect, znear, zfar);
					modelView = makeLookAt.apply(this, modelViewLookAt.flatten());

					// Get uniform locations
					uniforms = {};
					uniforms.perspective = new clockgl.Uniform(gl.getUniformLocation(shaderProgram, 'perspective'), perspective);
					uniforms.modelView = new clockgl.Uniform(gl.getUniformLocation(shaderProgram, 'modelView'), modelView);
					// Get world uniform location
					worldUniform = gl.getUniformLocation(shaderProgram, 'world');
				});

			// Meshes/Models deferred actions
			var meshesDeferred = clockgl.loadMeshes(gl, meshesSrcDef)
				.done(function(m) {
					// Set the models dictionary
					meshes = m;
					console.log(meshes);

					// Construct models from modelsDef
					models = $.map(modelsDef, function(opt, name) {
						return new clockgl.Model(gl, meshes[opt.mesh], opt.color, opt.world);
					});
					console.log(models);

					// Construct axes
					models.xaxis = clockgl.lineModel(gl, $V([0.0, 0.0, 0.0]), $V([100.0, 0.0, 0.0]), $V([1.0, 0.0, 0.0]));
					models.yaxis = clockgl.lineModel(gl, $V([0.0, 0.0, 0.0]), $V([0.0, 100.0, 0.0]), $V([0.0, 1.0, 0.0]));
					models.zaxis = clockgl.lineModel(gl, $V([0.0, 0.0, 0.0]), $V([0.0, 0.0, 100.0]), $V([0.0, 0.0, 1.0]));
					console.log(models);
				});

			// When shaders and models are done...
			$.when(shaderDeferred, meshesDeferred)
				.done(function() {
					// Set to update the scene periodically.
					runInterval = setInterval(updateScene, 15);
				}).fail(function(message) {
					// Throw w/ failure message
					throw message
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

		canvas 			= undefined;
		gl 				= undefined;
		shaderProgram 	= undefined;
		meshes 			= undefined;
		models 			= undefined;
		perspective 	= undefined;
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
			console.log('Unable to intialize WebGL. Your browser may not support it.');
			return null;
		}

		return webgl;
	}

	function updateScene() {
		try {
			clockgl.drawScene(gl, models, attributes, uniforms, worldUniform);
		}
		catch (e) {
			console.log(e);
			clearInterval(runInterval);
		}
	}

}(window.clockgl = window.clockgl || {}, jQuery));