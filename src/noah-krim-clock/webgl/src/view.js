/**
	view.js: shader methods
	author: Noah Krim
*/

(function(clockgl, $, undefined) {
	clockgl.initShaders = function(gl, vertexShader, fragmentShader) {
		// Load the shaders
		var vsh = loadShader(gl, vertexShader, gl.VERTEX_SHADER);
		if(!vsh)
			return null;
		var fsh = loadShader(gl, fragmentShader, gl.FRAGMENT_SHADER);
		if(!vsh)
			return null;

		// Create the shader program	
		var shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vsh);
		gl.attachShader(shaderProgram, fsh);
		gl.linkProgram(shaderProgram);

		// If creating the shader program failed, return null
		if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			console.log('Failed to create shader program: '+gl.getProgramInfoLog(shaderProgram));
			return null;
		}

		// On success, return shaderProgram
		return shaderProgram;
	}

	function loadShader(gl, shader, shaderType) {
		var shader = null;
		$.get(vertexShader, function(data) {
			shader = gl.createShader(shaderType);
			gl.shaderSource(shader, data);
			gl.compileShader(shader);
			if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				console.log('An error occurred compiling the shaders: '+gl.getShaderInfoLog(shader));
				shader = null;
			}
		});
		return shader;
	}
}(window.clockgl = window.clockgl || {}, jQuery));