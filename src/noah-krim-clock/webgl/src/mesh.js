/**
	mesh.js: object representations of meshes with dedicated buffers with differnet configurations buffer and drawing
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** Object declarations
	========================	*/
	var AbstractMesh;			// Abstract mesh that defines prototype methods with default implementation
	var AbstractIndexedMesh;	// Abstract mesh (child of AbstractMesh) that has an index buffer
	var Mesh;					// Standard triangle mesh with index buffer
	var LinesMesh;				// Mesh representing a single line

	/** Mesh loading
	================	*/
	/** Mesh loading
	----------------	*/
	clockgl.loadMeshesFromLoader = function(gl, meshesSrcDef) {
		var d = $.Deferred();
		var nameAndUrls = clockgl.mapObj(meshesSrcDef, function(opts) { return opts.src; });
		OBJ.downloadMeshes(nameAndUrls, function(meshes) {
			meshes = clockgl.mapObj(meshes, function(mesh, name) {
				var opts = meshesSrcDef[name];
				return new Mesh(gl, mesh.vertices, mesh.vertexNormals, mesh.indices, opts.uniforms, opts.usage);
			});
			d.resolve(meshes);
		});
		return d;
	}


	/** Abstract Mesh
	====================	*/
	AbstractMesh = function(gl, vertices, normals, meshUniformsDef, usage, mode) {
		// Set vertices and normals
		this.vertices = vertices;
		this.normals = normals;
		// Set mesh-specific uniforms
		this.uniformsDef = meshUniformsDef || {};
		// Default value for `this.vlength` using the `AbstractMesh.prototype.getVerticesLength()` method
		this.vlength = vertices.length/3;
		// Default value for `this.length` using the `AbsractMesh.prototype.getLength()` method which is supplied all arguments the constructor is supplied, should be overridden
		this.length = this.getLength.apply(this, arguments);
		// Set `this.mode` if present, or default to gl.TRIANGLES
		this.mode = typeof(mode) === 'number' ? mode : gl.TRIANGLES;

		// Create vertex buffer
		this.vbuf = gl.createBuffer();
		// Load vertex buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), usage || gl.STATIC_DRAW);

		// Create normal buffer
		this.nbuf = gl.createBuffer();
		// Load normal buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.nbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), usage || gl.STATIC_DRAW);
	}
	/** Constructor helpers
	------------------------	*/
	// Arguments are the same as what's given to the constructor (can give extra arguments to parent constructor to make this work)
	AbstractMesh.prototype.getLength = function() {
		return this.vlength;
	}
	/** Deconstructors
	--------------------	*/
	AbstractMesh.prototype.deleteBuffers = function(gl) {
		gl.deleteBuffer(this.vbuf);
		gl.deleteBuffer(this.nbuf);
	}
	/** Draw helpers (arguments should remain constant throughout)
	----------------------------------------------------------------	*/
	// Bind and point buffers for this mesh, last bind should be for the buffer that will be drawn
	AbstractMesh.prototype.bindForDraw = function(gl, attributeLocs, cbuf) {
		// Bind and point color buffer, if present
		if(cbuf && typeof(attributeLocs.color) !== 'undefined') {
			gl.bindBuffer(gl.ARRAY_BUFFER, cbuf);
			gl.vertexAttribPointer(attributeLocs.color, 4, gl.FLOAT, false, 0, 0);
		}

		// Bind and point normal buffer
		if(typeof(attributeLocs.normal) !== 'undefined') {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.nbuf);
			gl.vertexAttribPointer(attributeLocs.normal, 3, gl.FLOAT, false, 0, 0);
		}

		// Bind and point vertex buffer
		if(typeof(attributeLocs.position) !== 'undefined') {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
			gl.vertexAttribPointer(attributeLocs.position, 3, gl.FLOAT, false, 0, 0);
		}
	}
	// Loops through uniforms dict and sets each, does not need to be overriden in most cases
	AbstractMesh.prototype.setUniforms = function(gl, uniformsLayout, modelSceneUniforms, uniformsForce) {
		// Set argument (model/scene) uniforms
		$.each(modelSceneUniforms, function(name, uniform) {
			uniform.set(gl);
		});
		// Set mesh uniforms
		var meshUniforms = clockgl._initUniformsFromContextLayout(uniformsLayout.mesh, this.uniformsDef, uniformsForce.mesh);
		$.each(meshUniforms, function(name, uniform) {
			uniform.set(gl);
		});

	}
	// Default drawMesh() is to draw triangles from vertex arrays, usually does not need to be overridden
	AbstractMesh.prototype.drawMesh = function(gl) {
		gl.drawArrays(this.mode, 0, this.length);
	}
	// Default main draw method, uses the above methods in order, usually does not need to be overriden, one of the above should be, preferably
	AbstractMesh.prototype.draw = function(gl, shaderPrograms, cbuf, modelSceneUniforms, uniformsForce) {
		// Bind for draw
		this.bindForDraw(gl, shaderPrograms.attributeLocs, cbuf);
		// Set uniforms
		this.setUniforms(gl, shaderPrograms.uniformsLayout, modelSceneUniforms, uniformsForce);
		// Draw mesh
		this.drawMesh(gl);
	}


	/** Abstract Indexed Mesh (AbstractMesh)
	========================================	*/
	AbstractIndexedMesh = function(gl, vertices, normals, indices, meshUniformsDef, usage, mode) {
		// Inherit from AbstractMesh
		AbstractMesh.apply(this, [gl, vertices, normals, meshUniformsDef, usage, mode, /*For getLength()*/indices].concat(Array.prototype.splice.call(arguments, 7)));

		// Create index buffer
		this.ibuf = gl.createBuffer();
		// Load index buffer
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuf);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), usage || gl.STATIC_DRAW);
	}
	/* Inheritance of prototype
	----------------------------	*/
	AbstractIndexedMesh.prototype = Object.create(AbstractMesh.prototype);
	AbstractIndexedMesh.prototype.constructor = AbstractIndexedMesh;
	/** Constructor helpers
	------------------------	*/
	AbstractIndexedMesh.prototype.getLength = function() {
		if(arguments.length > 6) {
			var indices = arguments[6];
			return indices.length;
		}
		return 0;
	}
	/** Deconstructors
	--------------------	*/
	AbstractIndexedMesh.prototype.deleteBuffers = function(gl) {
		// Call parents `deleteBuffers()` method
		AbstractMesh.prototype.deleteBuffers.call(this);

		gl.deleteBuffer(this.ibuf);
	}
	/** Draw helpers (arguments should remain constant throughout)
	----------------------------------------------------------------	*/
	// Bind and point buffers for this mesh, last bind should be for the buffer that will be drawn
	AbstractIndexedMesh.prototype.bindForDraw = function(gl, attributes, cbuf) {
		// Call parents `bindForDraw()` method
		AbstractMesh.prototype.bindForDraw.apply(this, arguments);

		// Bind index buffer
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuf);
	}
	// Default drawMesh() is to draw triangles through an index buffer, usually does not need to be overriden
	AbstractIndexedMesh.prototype.drawMesh = function(gl) {
		gl.drawElements(this.mode, this.length, gl.UNSIGNED_SHORT, 0);
	}


	/**	Default Mesh (AbstractIndexedMesh)
	========================================	*/
	Mesh = function(gl, vertices, normals, indices, meshUniformsDef, usage) {
		// Inherit from AbstractIndexedMesh
		AbstractIndexedMesh.apply(this, [gl, vertices, normals, indices, meshUniformsDef, usage, gl.TRIANGLES].concat(Array.prototype.splice.call(arguments, 6)));
	}
	/* Inheritance of prototype
	----------------------------	*/
	Mesh.prototype = Object.create(AbstractIndexedMesh.prototype);
	Mesh.prototype.constructor = Mesh;
	/*Mesh.prototype.draw = function(gl, attributes, cbuf, modelSceneUniforms, uniformsLayout) {
		this.bindForDraw(gl, attributes, cbuf);

		gl.enable(gl.STENCIL_TEST);

		gl.clearStencil(0.0);
		gl.clear(gl.STENCIL_BUFFER_BIT);
		gl.stencilFunc(gl.ALWAYS, 1, ~0);
		gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
		this.mode = gl.TRIANGLES;
		
		var lighting_on = this.uniformsDef.lighting_on || clockgl.UNIFORM_FALSE;
		this.setUniforms(gl, modelSceneUniforms, uniformsLayout);

		this.drawMesh(gl);

		gl.stencilFunc(gl.NOTEQUAL, 1, ~0);
		gl.lineWidth(3);
		this.mode = gl.LINES;
		gl.colorMask(1, 0, 0, 1);
		
		this.uniformsDef.lighting_on = clockgl.UNIFORM_FALSE;
		this.setUniforms(gl, modelSceneUniforms, uniformsLayout);

		this.drawMesh(gl);

		gl.disable(gl.STENCIL_TEST);
		gl.lineWidth(1);
		gl.colorMask(1, 1, 1, 1);
		this.uniformsDef.lighting_on = lighting_on;
	}*/


	/** LineMesh (AbstractMesh)
	============================	*/
	LinesMesh = function(gl, vertices, normals, meshUniformsDef, usage) {
		normals = normals || clockgl.repeat(vertices.length, 1/3);
		// Inherit from AbstractMesh
		AbstractMesh.apply(this, [gl, vertices, normals, meshUniformsDef, usage, gl.LINES].concat(Array.prototype.splice.call(arguments,5)));
	}
	/* Inheritance of prototype
	----------------------------	*/
	LinesMesh.prototype = Object.create(AbstractMesh.prototype);
	LinesMesh.prototype.constructor = LinesMesh;


	/** Raw mesh initializers
	============================	*/
	// Expected options: {vertices[, normals][, usage]}
	clockgl.rawSingleLineMesh = function(gl, options, meshUniformsDef) {
		console.assert(options.start, 'Raw Single Line Mesh: options missing `start`\n\tExpected: {start, end[, startNormal, endNormal][, usage]}\n\tReceived: %o', options);
		console.assert(options.end, 'Raw Single Line Mesh: options missing `end`\n\tExpected: {start, end[, startNormal, endNormal][, usage]}\n\tReceived: %o', options);
		var vertices, normals;
		// Set vertices
		var start = options.start instanceof Vector ? options.start.flatten() : options.start;
		var end = options.end instanceof Vector ? options.end.flatten() : options.end;
		vertices = start.concat(end);
		// Set normals (if present)
		if(options.startNormal && options.endNormal) {
			var startNormal = options.startNormal instanceof Vector ? options.startNormal.flatten() : options.startNormal;
			var endNormal = options.endNormal instanceof Vector ? options.endNormal.flatten() : options.endNormal;
			normals = startNormal.concat(endNormal);
		}
		return new LinesMesh(gl, vertices, normals, meshUniformsDef, options.usage);
	}


	/** Exports
	============	*/
	clockgl.Mesh = Mesh;
	clockgl.LinesMesh = LinesMesh;

}(window.clockgl = window.clockgl || {}, jQuery));