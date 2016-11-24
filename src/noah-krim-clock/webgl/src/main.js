/**
	main.js: main interface to coordinate webgl actions for the noah-krim-clock polymer element
	author: Noah Krim
*/

(function(clockgl, $, undefined) {
	/**	Private variables
	========================	*/
	/**	Context variables
	------------------------	*/
	var canvas;
	var gl;
	/** Shader programs
	------------------------	*/
	var shaderProgram;
	/** Mesh/model variables
	------------------------	*/
	var models = {};
	var objects = []
	/** View matrices
	------------------------	*/
	var perspective;
	var modelView;
	/** Attribute locations
	------------------------	*/
	var posLoc;
	/** Uniform locations
	------------------------	*/
	var pUniform;
	var mUniform;
	var wUniform;

	clockgl.start = function(canvasElement) {

		canvas = canvasElement;

		// Initialize the GL context
		gl = initWebGL(canvas);
		if(!gl)
			return null;     

		// Only continue if WebGL is available and working
		if (gl) {
			gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
			gl.clearDepth(1.0);                 // Clear everything
			gl.enable(gl.DEPTH_TEST);           // Enable depth testing
			gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

			// Initialize the shaders
			shaderProgram = clockgl.initShaders(gl, '../shaders/shader.vsh', '../shaders/shader.fsh');
			gl.useProgram(shaderProgram);

			// Get attribute locations
			posLoc = gl.getAttribLocation(shaderProgram, 'position');
			// Enable attributes
			gl.enableVertexAttribArray(posLoc);

			// Get uniform locations
			pUniform = gl.getUniformLocation(shaderProgram, 'perspective');
			mUniform = gl.getUniformLocation(shaderProgram, 'modelView');
			wUniform = gl.getUniformLocation(shaderProgram, 'world');

			// Load models
			models.line = clockgl.loadModel(gl, '../data/line.json');

			// Construct objects
			


			// Set up to update the scene periodically.
			setInterval(updateScene, 15);
		}
	};

	function initWebGL(canvas) {
		var webgl = null;

		try {
			webgl = canvas.getContext('experimental-webgl');
		}
		catch {
		}

		if(!webgl) {
			console.log('Unable, intialize WebGL. Your browser may not support it.');
			return null;
		}

		return webgl;
	}
}(window.clockgl = window.clockgl || {}, jQuery));