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
	var modelSrcDef = {		// Model source definition (key: name, value: {fileUrl})
		'line': BASE+'/data/line.json',
	};
	/** Scene Objects
	----------------------------	*/
	var sceneObjsDef = {	// SceneObjs definition (key: name, value: {model[, color=white][, world=identity]})
		// Axes
		'xaxis': {'model': 'xaxis', 'color': $V([1.0, 0.0, 0.0, 1.0])},
		'yaxis': {'model': 'yaxis', 'color': $V([0.0, 1.0, 0.0, 1.0])},
		'zaxis': {'model': 'zaxis', 'color': $V([0.0, 0.0, 1.0, 1.0])},
		// Custom
		'line0': {'model': 'line',},
	}
	/** View
	----------------------------	*/
	var background = $V([0.0, 0.0, 0.0, 1.0]);
	var fovy = 45;
	var aspect = 640.0/480.0;
	var znear = 0.1
	var zfar = 100.0
	var modelViewLookAt = $M([   0.0,   7.0,   25.0,
		                         0.0,   7.0,   0.0,
		                         0.0,   1.0,   0.0]);

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
	var models;
	var sceneObjs;
	/** View matrices
	----------------------------	*/
	var perspective;
	var modelView;
	/** Attribute locations
	----------------------------	*/
	var posLoc;
	var colLoc;
	/** Uniform objects
	----------------------------	*/
	var uniforms;
	var worldUniform;
	/** Run instance
	----------------------------	*/
	var runInterval;

	clockgl.start = function(canvasElement, shaderProgramDefs) {
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
			var shaderDeferred = clockgl.initShaderProgram(gl, '/src/noah-krim-clock/webgl/shaders/shader.vsh', '/src/noah-krim-clock/webgl/shaders/shader.fsh')
				.done(function(sp) {
					// Set the shaderProgram
					shaderProgram = sp;

					// Initialize the shaders
					gl.useProgram(shaderProgram);

					// Get attribute locations
					posLoc = gl.getAttribLocation(shaderProgram, 'position');
					colLoc = gl.getAttribLocation(shaderProgram, 'color');
					// Enable attributes
					gl.enableVertexAttribArray(posLoc);
					gl.enableVertexAttribArray(colLoc);

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

			// Models/Objects deferred actions
			var modelsDeferred = clockgl.loadModels(gl, modelSrcDef)
				.done(function(m) {
					// Set the models dictionary
					models = m;

					// Construct axes
					models.xaxis = clockgl.lineModel(gl, $V([0.0, 0.0, 0.0]), $V([100.0, 0.0, 0.0]));
					models.yaxis = clockgl.lineModel(gl, $V([0.0, 0.0, 0.0]), $V([0.0, 100.0, 0.0]));
					models.zaxis = clockgl.lineModel(gl, $V([0.0, 0.0, 0.0]), $V([0.0, 0.0, 100.0]));

					// Construct sceneObjs from sceneObjsDef
					sceneObjs = Object.entries(sceneObjsDef).reduce(function(so, d) {
						var name = d[0];
						var objDef = d[1];
						so[name] = new clockgl.SceneObj(gl, models[objDef.model], objDef.color, objDef.world);
						return so;
					}, {});
				})

			// When shaders and models are done...
			$.when(shaderDeferred, modelsDeferred)
				.done(function() {
					// Set to update the scene periodically.
					runInterval = setInterval(updateScene, 15);
				})
		}
	};

	clockgl.pause = function() {
		clearInterval(runInterval);
	}
	clockgl.resume = function() {
		runInterval = setInterval(updateScene, 15);
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
			clockgl.drawScene(gl, sceneObjs, posLoc, colLoc, uniforms, worldUniform);
		}
		catch (e) {
			console.log(e);
			clearInterval(runInterval);
		}
	}

}(window.clockgl = window.clockgl || {}, jQuery));