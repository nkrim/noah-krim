/**
	program.js: object representing a compiled shader program and it's uniform and attribute locations 
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** ShaderProgramCache object definition
	============================================	*/
	var ShaderProgramCache = function(gl, compiledPrograms) {
		// Set programs
		this.programs = compiledPrograms

		// Set current program
		this._current = undefined;
	}
	ShaderProgramCache.prototype.delete = function(gl) {
		$.each(this.programs, function(name, cp) {
			cp.delete(gl);
		});
		this.programs = undefined;
		this._current = undefined;
	}

	Object.defineProperty(ShaderProgramCache.prototype, 'current', { get: function() { return this._current; }});
	Object.defineProperty(ShaderProgramCache.prototype, 'uniformsLayout', { get: function() { return this._current ? this._current.uniformsLayout : {}}});
	Object.defineProperty(ShaderProgramCache.prototype, 'attributeLocs', { get: function() { return this._current ? this._current.attributeLocs : {}}});

	ShaderProgramCache.prototype.useProgram = function(gl, name) {
		var toUse = this.programs[name];
		if(!toUse)
			console.warn('Shader program "%s" does not exist in this cache, ignoring useProgram()', name);
		else {
			if(this._current) {
				this.ensureCurrent(gl);
				this._current.disable(gl);
			}
			toUse.useProgram(gl);
			toUse.enable(gl);
			this._current = toUse;
			return this._current;
		}
	}
	ShaderProgramCache.prototype.ensureCurrent = function(gl) {
		if(!this._current)
			return false;
		if(!this._current.isCurrentProgram(gl)) {
			this._current.useProgram(gl);
			return false;
		}
		return true;
	}


	/** CompiledProgram object definition
	========================================	*/
	var CompiledProgram = function(gl, shaderProgram, attributeNames, uniformsLayoutDef) {
		// Set shader program
		this.program = shaderProgram;

		// Init attribute locations
		var attributeLocs = {};
		this._minLoc = Infinity;
		this._maxLoc = -Infinity;
		$.each(attributeNames || [], function(index, name) {
			var loc = gl.getAttribLocation(shaderProgram, name);
			this._minLoc = Math.min(this._minLoc, loc);
			this._maxLoc = Math.max(this._maxLoc, loc);
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
		gl.deleteProgram(this.program);
	}

	CompiledProgram.prototype.isCurrentProgram = function(gl) {
		var current = clockgl.getCurrentProgram(gl);
		if(this.program === current)
			return true;
		return false;
	}
	CompiledProgram.prototype.useProgram = function(gl) {
		gl.useProgram(this.program);
	}

	CompiledProgram.prototype.enable = function(gl) {
		if(!this.isCurrentProgram(gl))
			console.error('Cannot enable/disable program if it is not the current program. Make sure this.useProgram() is used first.');
		$.each(this.attributeLocs, function(name, loc) {
			gl.enableVertexAttribArray(loc);	
		});
	}
	CompiledProgram.prototype.disable = function(gl) {
		if(!this.isCurrentProgram(gl))
			console.error('Cannot enable/disable program if it is not the current program. Make sure this.useProgram() is used first.');
		$.each(this.attributeLocs, function(name, loc) {
			gl.disableVertexAttribArray(loc);
		});
	}
	CompiledProgram.prototype.toggleAttribute = function(gl, attributeName, state) {
		var loc = this.attributeLocs[attributeName];
		if(!loc)
			console.warn('Attempt to %s non-existent attribute "%s"', state ? 'enable' : 'disable', attributeName);
		else if(state)
			gl.enableVertexAttribArray(loc);
		else
			gl.disableVertexAttribArray(loc);
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
			return new ShaderProgramCache(gl, $.extend.apply($, [{}].concat(Array.prototype.slice.call(arguments))));
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


	/** External helpers
	========================	*/
	clockgl.getCurrentProgram = function(gl) {
		return gl.getParameter(gl.CURRENT_PROGRAM);
	}

}(window.clockgl = window.clockgl || {}, jQuery));