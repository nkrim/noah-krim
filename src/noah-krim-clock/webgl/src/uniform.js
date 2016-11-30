/**
	uniform.js: represents a uniform and it's current uniform position in the shaders
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** Uniform object - Matrix4Float32 (default)
	========================================	*/
	var Uniform = function(gl, loc, val, method) {
		this.loc = loc;
		this.val = val;
		this.method = gl.uniformMatrix4fv;
	}

	Uniform.prototype.set = function() {
		this.method(this.loc, false, new Float32Array(this.val.flatten()));
	}

	// Export Uniform
	clockgl.Uniform = Uniform;

}(window.clockgl = window.clockgl || {}, jQuery))