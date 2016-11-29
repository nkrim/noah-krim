/**
	uniform.js: represents a uniform and it's current uniform position in the shaders
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** Uniform object - Matrix4Float32 (default)
	========================================	*/
	var Uniform = function(loc, val) {
		this.loc = loc;
		this.val = val;
	}

	Uniform.prototype.set = function(gl) {
		gl.uniformMatrix4fv(this.loc, false, new Float32Array(this.val.flatten()));
	}

	// Export Uniform
	clockgl.Uniform = Uniform;

}(window.clockgl = window.clockgl || {}, jQuery))