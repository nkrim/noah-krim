/**
	model.js: object to represent an instance of a mesh
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** Object declarations
	========================	*/
	var Model;	// Model holding a mesh, color, and world matrix


	/** Specialized model constructors
	====================================	*/
	// LineMesh constructor
	clockgl.lineModel = function(gl, start, end, color, world) {
		if(start instanceof Vector)
			start = start.flatten();
		if(end instanceof Vector)
			end = end.flatten(); 
		return new Model(gl, new clockgl.LinesMesh(gl, clockgl.dechunk([start, end])), color, world);
	}


	/** Model object
	================	*/
	Model = function(gl, mesh, color, world) {
		// Set object mesh
		this.mesh = mesh;
		// Set color (default is white)
		this.setColor(gl, color || [1.0, 1.0, 1.0, 1.0]);
		// Set world matrix (default is identity)
		this.world = world || $V([1,1,1]);
	}
	/** Properties
	----------------	*/
	Object.defineProperty(Model.prototype, 'color', { get: function() { return this._color }});
	/** Color helpers
	--------------------	*/
	Model.prototype.setColor = function(gl, color, usage) {
		if(color instanceof Array) {
			if(color.length == 3)
				this._color = $V(color.concat(1.0));
			else if(color.length >= 4)
				this._color = $V(color.slice(0,4));
			else
				throw ['Model setColor: color array is too short\nExpected: length >= 3\nReceived: length = %d (%o)', color.length, color];
		}
		else if(color instanceof Vector) {
			if(color.dimensions() == 3)
				this._color = $V(color.elements.concat(1.0));
			else if(color.dimensions() >= 4)
				this._color = $V(color.elements.slice(0,4));
			else
				throw ['Model setColor: color vector is too short\nExpected: length >= 3\nReceived: length = %d (%o)', color.dimensions(), color];
		}
		else {
			throw ['Model setColor(): illegal color type\nExpected: Array or Vector with length>=3\nReceived: %o', color];
		}

		// On success, load the color buffer with the new color data
		this.loadColorBuffer(gl, null, usage);
	}
	Model.prototype._genColorBuffer = function(gl, usage) {
		// Create color buffer
		this.cbuf = gl.createBuffer();
		// Return loaded color buffer reference
		return this.loadColorBuffer(gl, usage);
	}
	Model.prototype.loadColorBuffer = function(gl, usage) {
		// Reassign cbuf if empty argument, or generate if this doesn't have one
		if(this.cbuf)
			return this._genColorBuffer(gl, usage);

		// Create color array
		var colArr = function(arr, rep) {
			var ret = [];
			for(var i=0; i<rep; i++)
				ret = ret.concat(arr);
			return ret;
		}(this._color.flatten(), this.mesh.vlength);

		// Load color buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, cbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colArr), usage || gl.STATIC_DRAW);

		// Return color buffer reference
		return cbuf;
	}
	/** Draw methods
	----------------	*/
	Model.prototype.draw = function(gl, attributes, uniforms, worldUniform) {
		// Copy uniforms dict and add world uniform
		uniforms = $.extend({}, uniforms, {world: new clockgl.Uniform(gl, clockgl.UNIFORM.VEC3F, worldUniform, this.world)});
		// Draw model's mesh
		this.mesh.draw(gl, attributes, uniforms, this.cbuf);
	}


	/** Exports
	============	*/
	clockgl.Model = Model;

}(window.clockgl = window.clockgl || {}, jQuery));