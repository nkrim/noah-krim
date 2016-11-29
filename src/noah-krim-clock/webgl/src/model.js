/**
	model.js: object to represent a set of meshes and load them from a .obj file
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** Model object
	================	*/
	var Model = function(meshes, drawType) {
		this.meshes = meshes;
	}

	Model.prototype.draw = function(gl, posLoc, colLoc, uniforms, colorBuffers) {
		for(var i=0; i<this.meshes.length; i++) {
			var mesh = this.meshes[i];
			mesh.draw(gl, posLoc, colLoc, uniforms, colorBuffers[i]);
		}
	}

	/** Load models from files
	----------------------------	*/
	clockgl.loadModel = function(gl, fileUrl, drawType) {
		return $.getJSON(fileUrl)
			.then(function(data) {
				// Init empty meshes array
				meshes = [];
				// Fill meshes array from json data
				$.each(data, function(key, val) {
					meshes.push(new Mesh(gl, val.vertices, val.indices));
				});
				// Return meshes array
				return new Model(meshes);
			});
	}

	clockgl.loadModels = function(gl, modelSrcDef) {
		// Load all models and get their deferred objects, transformed to objects with a name and a model
		var deferredModels = $.map(modelSrcDef, function(file, name) {
			return clockgl.loadModel(gl, file)
				.then(function(model) {
					return {
						'name': name,
						'model': model
					};
				},function() {
					return $.Deferred.reject('Failed to load model "'+name+'" at: '+file);
				});
		});
		if(deferredModels.length === 0)
			return $.Deferred().resolve({});
		// Wait on all deferreds and concatenate into one object
		return $.when.apply(this, deferredModels)
			.then(function() {
				return Array.prototype.reduce.call(arguments, function(m, d) {
					m[d.name] = d.model;
					return m;
				}, {});
			});
	}

	/** Create models from shapes
	--------------------------------	*/
	clockgl.lineModel = function(gl, start, end, world) {
		return new Model([new LineMesh(gl, start, end)], world);
	}

	/**	Mesh object - TRIANGLES (default)
	========================================	*/
	var Mesh = function(gl, vertices, indices) {
		// Get number of indices
		this.nindices = indices.length;
		console.log(new Float32Array(Array.prototype.concat.apply([],vertices)));

		// Create vertex and index buffers
		this.vbuf = gl.createBuffer();
		this.ibuf = gl.createBuffer();

		// Load vertex buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Array.prototype.concat.apply([],vertices)), gl.STATIC_DRAW);
		// Load index buffer
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuf);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Array.prototype.concat.apply([],indices)), gl.STATIC_DRAW);
	}

	Mesh.prototype.draw = function(gl, posLoc, colLoc, uniforms, cbuf) {
		// Bind and point color buffer, if present
		if(cbuf) {
			gl.bindBuffer(gl.ARRAY_BUFFER, cbuf);
			gl.vertexAttribPointer(colLoc, 4, gl.FLOAT, false, 0, 0);
		}

		// Bind and point vertex buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
		gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

		// Bind index buffer
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuf);

		// Set uniforms
		clockgl.setUniforms(gl, uniforms);

		// Draw mesh
		gl.drawElements(gl.TRIANGLES, this.nindices, gl.UNSIGNED_SHORT, 0);
	}

	/** Mesh object - LINES
	========================	*/
	var LineMesh = function(gl, start, end) {
		// Get number of indices
		this.nindices = 2;

		// Create vertex buffer
		this.vbuf = gl.createBuffer();

		// Load vertex buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array($V(start).flatten().concat($V(end).flatten())), gl.STATIC_DRAW);
	}

	LineMesh.prototype.draw = function(gl, posLoc, colLoc, uniforms, cbuf) {
		// Bind and point color buffer, if present
		if(cbuf) {
			gl.bindBuffer(gl.ARRAY_BUFFER, cbuf);
			gl.vertexAttribPointer(colLoc, 4, gl.FLOAT, false, 0, 0);
		}

		// Bind and point vertex buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
		gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

		// Set uniforms
		clockgl.setUniforms(gl, uniforms);

		// Draw mesh
		gl.drawArrays(gl.LINES, 0, this.nindices);
	}

}(window.clockgl = window.clockgl || {}, jQuery));