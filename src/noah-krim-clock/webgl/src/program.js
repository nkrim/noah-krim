/**
	program.js: object representing a compiled shader program and it's uniform and attribute locations 
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** CompiledProgram object definition
	========================================	*/
	var CompiledProgram = function(gl, shaderProgram, attributeNames, uniformsLayoutDef) {
		// Set shader program
		this.program = shaderProgram;

		// Init attribute locations
		var attributeLocs = {};
		$.each(attributeNames || [], function(index, name) {
			var loc = gl.getAttribLocation(shaderProgram, name);
			attributeLocs[name] = loc;
		});
		this.attributeLocs = attributeLocs;

		// Init uniforms layout
		var uniformsLayout = {};
		$.each(uniformsLayoutDef || {}, function(context, uniformsDef) {
			uniformsLayout[context] = clockgl.mapObj(uniformsDef, function(opts, name) {
				var loc = gl.getUniformLocation(shaderProgram, name);
				var uniform = new clockgl.Uniform(opts.type, loc, opts.default);
				return uniform;
			});
		});
		this.uniformsLayout = uniformsLayout;
	}

	CompiledProgram.prototype.delete = function(gl) {
		$.each(this.program.trackedObject.shaders, function(index, shader) {
			gl.deleteShader(shader);
		});
		gl.deleteProgram(cp.program);
	}

	CompiledProgram.prototype.enable = function(gl) {
		gl.useProgram(this.program);
		$.each(this.attributeLocs, function(name, loc) {
			gl.enableVertexAttribArray(loc);	
		});
	}

	CompiledProgram.prototype.disable = function(gl) {
		$.each(this.attributeLocs, function(name, loc) {
			gl.disableVertexAttribArray(loc);
		});
	}

	CompiledProgram.prototype.toggleAttribute = function(gl, attribute, state) {
		var loc = this.attributeLocs[attribute];
		if(loc) {
			if(state)
				gl.enableVertexAttribArray(loc);
			else
				gl.disableVertexAttribArray(loc);
		}
	}

	/** External initialization
	================================	*/
	clockgl.loadShaderPrograms = function(gl, shaderProgramDefs) {
		return $.when.apply($, $.map(shaderProgramDefs, function(def, name) {
			var vshD = getShader(gl, def.vsh, gl.VERTEX_SHADER);
			var fshD = getShader(gl, def.fsh, gl.FRAGMENT_SHADER);
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
					var ret = {};
					ret[name] = new CompiledProgram(gl, shaderProgram, def.attributes, def.uniforms);
					return ret;
				})
			})
		).then(function() {
			return $.extend.apply($, [{}].concat(Array.prototype.slice.call(arguments)));
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