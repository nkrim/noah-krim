/**
	uniform.js: represents a uniform and it's current uniform position in the shaders
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** Uniform Type Enums
	========================	*/
	clockgl.UNIFORM = {
		// Matrices
		MAT2F: 2,
		MAT3F: 3,
		MAT4F: 4,
		// Float vectors
		VEC1F: 11,
		VEC2F: 12,
		VEC3F: 13,
		VEC4F: 14,
		// Int vectors
		VEC1I: 21,
		VEC2I: 22,
		VEC3I: 23,
		VEC4I: 24,
	}

	/** Uniform object - Matrix4Float32 (default)
	========================================	*/
	var Uniform = function(gl, type, loc, val) {
		this.loc = loc;
		this.type = type || clockgl.UNIFORM.MAT4F;
		this.val = val;
		this.setter = Uniform._getSetter(gl, type);
	}

	Uniform.prototype.set = function() {
		this.setter(this.loc, this.val);
	}

	Uniform._getSetter = function(gl, type) {
		var arrF = Float32Array;
		var arrI = Int32Array;
		var setConM = 	function(method) { 
							return function(loc, val) { 
								return method(loc, false, new arrF(val.flatten()));
							};
						};
		var setConV = 	function(method, arrType) { 
							return function(loc, val) { 
								return method(loc, new arrType(val.flatten()));
							};
						};
		var setConF = function(method) { return setConV(method, arrF); };
		var setConI = function(method) { return setConV(method, arrI); };
		switch(type) {
			// Matrices
			case clockgl.UNIFORM.MAT2F:
				return setConM(gl.uniformMatrix2fv);
			case clockgl.UNIFORM.MAT3F:
				return setConM(gl.uniformMatrix3fv);
			case clockgl.UNIFORM.MAT4F:
				return setConM(gl.uniformMatrix4fv);
			// Float vectors
			case clockgl.UNIFORM.VEC1F:
				return setConF(gl.uniform1fv);
			case clockgl.UNIFORM.VEC2F:
				return setConF(gl.uniform2fv);
			case clockgl.UNIFORM.VEC3F:
				return setConF(gl.uniform3fv);
			case clockgl.UNIFORM.VEC4F:
				return setConF(gl.uniform4fv);
			// Int vectors
			case clockgl.UNIFORM.VEC1I:
				return setConI(gl.uniform1iv);
			case clockgl.UNIFORM.VEC2I:
				return setConI(gl.uniform2iv);
			case clockgl.UNIFORM.VEC3I:
				return setConI(gl.uniform3iv);
			case clockgl.UNIFORM.VEC4I:
				return setConI(gl.uniform4iv);
		}
		throw 'Uniform type of value '+type+' not recognized';
	}

	/** Alternate uniform constructors
	====================================	*/
	clockgl.uniformFromProgram = function(gl, type, shaderProgram, name, val) {
		return new Uniform(gl, type, gl.getUniformLocation(shaderProgram, name), val);
	}

	// Export Uniform
	clockgl.Uniform = Uniform;

}(window.clockgl = window.clockgl || {}, jQuery))