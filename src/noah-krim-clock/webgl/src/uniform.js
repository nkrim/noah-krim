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

	/** Uniform statics
	====================	*/
	clockgl.UNIFORM_TRUE = $V([1]);
	clockgl.UNIFORM_FALSE = $V([0]);

	/** Uniform object - Matrix4Float32 (default)
	========================================	*/
	var Uniform = function(type, loc, val) {
		this._type = type || clockgl.UNIFORM.MAT4F;
		console.assert(this.isMatrix() || this.isVector(), 'Uniform: type not found\n\tExpected: one of clockgl.UNIFORM (%o)\n\tReceived: %o', clockgl.UNIFORM, type);
		this.loc = loc;
		this._val = val || null;

		this._setter = null;
	}

	/** Uniform properties
	------------------------	*/
	Object.defineProperty(Uniform.prototype, 'type', {
		get: function() {
			return this._type;
		},
		set: function(type) {
			if(this._type === type)
				return;
			this._type = this.type;
			console.assert(this.isMatrix() || this.isVector(), 'Uniform: type not found\n\tExpected: one of clockgl.UNIFORM (%o)\n\tRceived: %o', clockgl.UNIFORM, type);
			this._setter = undefined;
		}
	});
	Object.defineProperty(Uniform.prototype, 'val', {
		get: function() {
			return this._val;
		},
		set: function(val) {
			if(this.isMatrix()) {
				var td = this.dimensions();
				console.assert(val instanceof Matrix, 'Uniform: illegal value\n\tExpected: %dx%d Matrix\n\tReceived: %o', td.rows, td.cols, val);
				var vd = val.dimensions();
				console.assert(vd.rows==td.rows && vd.cols==td.cols, 'Uniform: wrong matrix dimensionn\n\tExpected: %dx%d Matrix\n\tReceived: %dx%d Matrix (%o)', td.rows, td.cols, vd.rows, vd.cols, val);
				this._val = val;
			}
			else if(this.isVector()) {
				var td = this.dimensions();
				console.assert(val instanceof Vector, 'Uniform: illegal value\n\tExpected: %dD Vector\n\tReceived: %o', td, val);
				var vd = val.dimensions();
				console.assert(td == vd, 'Uniform: wrong vector dimensions\n\tExpected: %dD Vector\n\t Received: %dD Vector (%o)', td, vd, val);
				this._val = val;
			}
			else {
				console.warn('Warning: uniform %o has an unknown type')
				this._val = val;
			}
		}
	});

	/** Uniform instance methods
	----------------------------	*/
	Uniform.prototype.clone = function(newVal) {
		return new Uniform(this._type, this.loc, newVal || this._val);
	}

	Uniform.prototype.set = function(gl) {
		if(!this._setter)
			this._setter = Uniform._getSetter(gl, this._type);		
		this._setter(this.loc, this._val);
	}

	Uniform.prototype.isMatrix = function() {
		return this._type >= 2 && this._type <= 4;
	}

	Uniform.prototype.isVector = function() {
		return this._type >= 11 && this._type <= 14 || this._type >= 21 && this._type <= 24;
	}

	Uniform.prototype.dimensions = function() {
		if(this.isMatrix()) {
			return {
				rows: this.type,
				cols: this.type,
			}
		}
		else if(this.isVector()) {
			return this._type%10;
		}
		else {
			return NaN;
		}
	}

	/** Uniform static methods
	----------------------------	*/
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
		var func;
		var isMatrix = false;
		var isFloat = true;
		switch(type) {
			// Matrices
			case clockgl.UNIFORM.MAT2F:
				func = gl.uniformMatrix2fv;
				isMatrix = true;
				break;
			case clockgl.UNIFORM.MAT3F:
				func = gl.uniformMatrix3fv;
				isMatrix = true;
				break;
			case clockgl.UNIFORM.MAT4F:
				func = gl.uniformMatrix4fv;
				isMatrix = true;
				break;
			// Float vectors
			case clockgl.UNIFORM.VEC1F:
				func = gl.uniform1fv;
				break;
			case clockgl.UNIFORM.VEC2F:
				func = gl.uniform2fv;
				break;
			case clockgl.UNIFORM.VEC3F:
				func = gl.uniform3fv;
				break;
			case clockgl.UNIFORM.VEC4F:
				func = gl.uniform4fv;
				break;
			// Int vectors
			case clockgl.UNIFORM.VEC1I:
				func = gl.uniform1iv;
				isFloat = false;
				break;
			case clockgl.UNIFORM.VEC2I:
				func = gl.uniform2iv;
				isFloat = false;
				break;
			case clockgl.UNIFORM.VEC3I:
				func = gl.uniform3iv;
				isFloat = false;
				break;
			case clockgl.UNIFORM.VEC4I:
				func = gl.uniform4iv;
				isFloat = false;
				break;
			default: 
				throw ['Uniform type of value %o not recognized', type];
		}
		return function(loc, val) { 
			return func.apply(gl, [loc].concat(
											isMatrix ? [false] : [], 
											isFloat ? [new Float32Array(val.flatten())] : [new Int32Array(val.flatten())]
										)); 
		}
	}

	// Export Uniform
	clockgl.Uniform = Uniform;

}(window.clockgl = window.clockgl || {}, jQuery))