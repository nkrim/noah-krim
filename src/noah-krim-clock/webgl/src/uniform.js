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
	var Uniform = function(type, loc) {
		this._type = type || clockgl.UNIFORM.MAT4F;
		console.assert(this.isMatrix() || this.isVector(), 'Uniform: type not found\nExpected: one of clockgl.UNIFORM (%o)\nReceived: %o', clockgl.UNIFORM, type);
		this.loc = loc;

		this._val = null;
		this._setter = null;
	}

	/** Uniform properties
	------------------------	*/
	Object.defineProperty(Unform.prototype, 'type', {
		get: function() {
			return this._type;
		},
		set: function(type) {
			if(this._type === type)
				return;
			this._type = this.type;
			console.assert(this.isMatrix() || this.isVector(), 'Uniform: type not found\nExpected: one of clockgl.UNIFORM (%o)\nRceived: %o', clockgl.UNIFORM, type);
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
				console.assert(val instanceof Matrix, 'Uniform: illegal value\nExpected: %dx%d Matrix\nReceived: %o', td.rows, td.cols, val);
				var vd = val.dimensions();
				console.assert(vd.rows==td.rows && vd.cols==td.cols, 'Uniform: wrong matrix dimensionn\nExpected: %dx%d Matrix\nReceived: %dx%d Matrix (%o)', td.rows, td.cols, vd.rows, vd.cols, val);
				this._val = val;
			}
			else if(this.isVector()) {
				var td = this.dimensions();
				console.assert(val instanceof Matrix, 'Uniform: illegal value\nExpected: %dx%d Matrix\nReceived: %o', td.rows, td.cols, val);
				var vd = val.dimensions();
				console.assert(vd.rows==td.rows && vd.cols==td.cols, 'Uniform: wrong matrix dimensionn\nExpected: %dx%d Matrix\n Received: %dx%d Matrix (%o)', td.rows, td.cols, vd.rows, vd.cols, val);
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
	Uniform.prototype.clone = function() {
		return new Uniform(this._type, this.loc, this.val);
	}

	Uniform.prototype.set = function(gl) {
		if(!this._setter)
			this._setter = Uniform._getSetter(gl, type);		
		this._setter(this.loc, this.val);
	}

	Uniform.prototype.isMatrix() {
		return this._type >= 2 && this._type <= 4;
	}

	Uniform.prototype.isVector() {
		return this._type >= 11 && this._type <= 14 || this._type >= 21 && this._type <= 24;
	}

	Uniform.prototype.dimensions() {
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
		throw ['Uniform type of value %o not recognized', type];
	}

	// Export Uniform
	clockgl.Uniform = Uniform;

}(window.clockgl = window.clockgl || {}, jQuery))