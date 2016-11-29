/**
	sceneobj.js: represents an object in the scene, which is a model and a toworld matrix
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** Scene Object object
	=======================	*/
	var SceneObj = function(gl, model, color, world) {
		this.model = model;
		this.color = color = $V(color || [1.0, 1.0, 1.0, 1.0]); // Defaults to white 
		this.world = world || Matrix.I(4); // Defaults to identity

		// Init colors buffers
		this.colorBuffers = model.meshes.map(function(mesh) {
			// Create color array
			var colArr = function(arr, rep) {
				var ret = [];
				for(var i=0; i<rep; i++)
					ret = ret.concat(arr);
				return ret;
			}(color.flatten(), mesh.nindices);
			// Create and load color buffer
			var cbuf = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, cbuf);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colArr), gl.STATIC_DRAW);
			// Return color buffer reference
			return cbuf;
		});
	}

	SceneObj.prototype.draw = function(gl, posLoc, colLoc, uniforms, wUniform) {
		uniforms.world = new clockgl.Uniform(wUniform, this.world);
		this.model.draw(gl, posLoc, colLoc, uniforms, this.colorBuffers);
	}

	// Export SceneObj
	clockgl.SceneObj = SceneObj;

}(window.clockgl = window.clockgl || {}, jQuery));