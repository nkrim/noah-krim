/**
	model.js: object to represent an instance of a mesh
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** Object declarations
	========================	*/
	var Model;	// Model holding a mesh, color, and world matrix


	/** Model object
	================	*/
	Model = function(gl, mesh, color, world, modelUniformsDef, colorUsage) {
		// Set object mesh
		this.mesh = mesh;
		// Set color (default is white)
		this.setColor(gl, color || [1.0, 1.0, 1.0, 1.0], colorUsage);
		// Set world matrix (default is identity)
		this.world = world || new clockgl.World();
		// Set uniforms definition
		this.uniformsDef = modelUniformsDef || {};
	}


	/** Properties
	----------------	*/
	Object.defineProperty(Model.prototype, 'color', { get: function() { return this._color }});
	Object.defineProperty(Model.prototype, 'mode', { get: function() { return this.mesh.mode}, set: function(mode) { this.mesh.mode = mode;}});


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
		if(!this.cbuf)
			return this._genColorBuffer(gl, usage);

		// Create color array
		var colArr = function(arr, rep) {
			var ret = [];
			for(var i=0; i<rep; i++)
				ret = ret.concat(arr);
			return ret;
		}(this._color.flatten(), this.mesh.vlength);

		// Load color buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.cbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colArr), usage || gl.STATIC_DRAW);
	}
	Model.prototype.deleteBuffers = function(gl) {
		if(this.cbuf)
			gl.deleteBuffers(cbuf);
		$.each(this.meshes || {}, function(name, mesh) {
			mesh.deleteBuffers(gl);
		})
	}


	/** Draw methods
	----------------	*/
	Model.prototype.draw = function(gl, shaderPrograms, uniforms, uniformsForce) {
		//if(this.hide)
			//return;
		// Add model uniforms/defaults to uniforms dict
		var modelUniformsDef = $.extend({
			base: this.world.baseMatrix(),
			scale: this.world.scaleMatrix(),
			rotation: this.world.rotationMatrix(),
			translation: this.world.translationMatrix(),
		}, this.uniformsDef);
		$.extend(uniforms, clockgl._initUniformsFromContextLayout(shaderPrograms.uniformsLayout.model, modelUniformsDef, uniformsForce.model));
		// Draw model's mesh
		this.mesh.draw(gl, shaderPrograms, this.cbuf, uniforms, uniformsForce);
	}


	/** Exports
	============	*/
	clockgl.Model = Model;

}(window.clockgl = window.clockgl || {}, jQuery));