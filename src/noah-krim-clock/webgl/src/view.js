/**
	view.js: shader methods
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	clockgl.drawScene = function(gl, sceneObjs, timeDiff, attributeLocs, sceneUniforms, uniformsLayout, uniformsForce) {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		$.each(sceneObjs, function(key, so) {
			var updateRet = so.update(timeDiff);
			if(typeof(updateRet) !== 'undefined')
				console.log(updateRet);
			so.draw(gl, attributeLocs, sceneUniforms, uniformsLayout, uniformsForce);
		});
	}

	clockgl.initShaderProgram = function(gl, vertexShader, fragmentShader) {
		// Load the shaders
		var vshD = getShader(gl, vertexShader, gl.VERTEX_SHADER);
		var fshD = getShader(gl, fragmentShader, gl.FRAGMENT_SHADER);
		return $.when(vshD, fshD)
			.then(function(vsh, fsh) {
				// Create the shader program	
				var shaderProgram = gl.createProgram();
				gl.attachShader(shaderProgram, vsh);
				gl.attachShader(shaderProgram, fsh);
				gl.linkProgram(shaderProgram);
				// If creating the shader program failed, reject
				if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
					return $.Deferred().reject('Failed to create shader program: '+gl.getProgramInfoLog(shaderProgram));
				}
				// On success, return shaderProgram
				return shaderProgram;
			});
	}

	function getShader(gl, shaderLoc, shaderType) {
		return $.get(shaderLoc)
			.then(function(data) {
				// Create and compile the shader
				var shader = gl.createShader(shaderType);
				gl.shaderSource(shader, data);
				gl.compileShader(shader);
				// If compiling the shader failed, reject
				if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
					return $.Deferred().reject('An error occurred compiling the shaders: '+gl.getShaderInfoLog(shader));
				}
				// On success, return shader
				return shader;
			});
	}
	
}(window.clockgl = window.clockgl || {}, jQuery));