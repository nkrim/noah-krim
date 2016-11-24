/**
	model.js: object to represent a set of meshes and load them from a .obj file
	author: Noah Krim
*/

(function(clockgl, $, undefined) {
	/**	Mesh object
	================	*/
	var Mesh = function(gl, vertices, indices) {
		// Get number of indices
		this.nindices = indices.length;

		// Create vertex and index buffers
		this.vbuf = gl.createBuffer();
		this.ibuf = gl.createBuffer();

		// Load vertex buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
		// Load index buffer
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuf);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
	}

	Mesh.prototype.bindForDraw = function(gl, posLoc) {
		// Bind and point vertex buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
		gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

		// Bind index buffer
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuf);
	}

	/** Model object
	================	*/
	var Model = function(meshes) {
		this.meshes = meshes;
	}

	Model.prototype.draw = function(gl, posLoc, perspective, pUniform, modelView, mUniform, world, wUniform) {
		for(var i=0; i<this.meshes.length; i++) {
			var mesh = this.meshes[i];
			// Bind mesh
			mesh.bindForDraw(gl, posLoc);
			// Set uniforms
			gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspective.flatten()));
			gl.uniformMatrix4fv(mUniform, false, new Float32Array(modelView.flatten()));
			gl.uniformMatrix4fv(wUniform, false, new Float32Array(world.flatten()));
			// Draw mesh
			gl.drawElements(gl.TRIANGLES, mesh.nindices, gl.UNSIGNED_SHORT, 0);
		}
	}

	clockgl.loadModel = function(gl, fileUrl) {
		var meshes = null;
		$.getJSON(fileUrl, function(data) {
			meshes = [];
			$.each(data, function(key, val) {
				meshes.push(new Mesh(gl, val.vertices, val.indices));
			})
		});
		if(!meshes)
			return null;
		return new Model(meshes);
	}
}(window.clockgl = window.clockgl || {}, jQuery));