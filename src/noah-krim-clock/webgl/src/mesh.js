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
	clockgl.loadMeshesFromLoader = function(gl, nameAndUrls) {
		var d = $.Deferred();
		OBJ.downloadMeshes(nameAndUrls, function(meshes) {
			meshes = clockgl.mapObj(meshes, function(mesh) {
				return new Mesh(gl, mesh.vertices, mesh.indices);
			});
			d.resolve(meshes);
		});
		return d;
	}
	clockgl.loadMesh = function(gl, fileUrl, meshType, usage) {
		return $.getJSON(fileUrl)
			.then(function(data) {
				// If mesh is an indexed mesh, use indices
				if(meshType.prototype instanceof AbstractIndexedMesh)
					return new meshType(gl, data.vertices, data.indices, usage);				
				// If mesh is a normal mesh, use only vertices
				else if(meshType.prototype instanceof AbstractMesh)
					return new meshType(gl, data.vertices, usage);
				// Otherwise, reject 
				else
					return $.Deferred().reject('Failed to load mesh: '+meshType+' is not a valid mesh type');
			});
	}
	clockgl.loadMeshes = function(gl, meshesSrcDef) {
		// Load all meshes and get their deferred objects, transformed to singleton objects with its name as the key with the mesh as its value
		var deferredMeshes = $.map(meshesSrcDef, function(opt, name) {
			return clockgl.loadMesh(gl, opt.src, opt.type || Mesh, opt.usage)
				.then(function(mesh) {
					var ret = {};
					ret[name] = mesh;
					return ret;
				},function() {
					return $.Deferred().reject('Failed to load mesh "'+name+'" with from src: '+opt.src);
				});
		});
		if(deferredMeshes.length === 0)
			return $.Deferred().resolve({});
		// Wait on all deferreds and concatenate into one object
		return $.when.apply(this, deferredMeshes)
			.then(function() {
				return $.extend.apply(this, [{}].concat(Array.from(arguments)));
			});
	}


	/** Abstract Mesh
	====================	*/
	AbstractMesh = function(gl, vertices, normals, usage, mode) {
		// Set vertices and normals
		this.vertices = vertices;
		this.normals = normals;
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
		if(this.vlength)
			return this.vlength;
		if(arguments.length > 1) {
			var vertices = arguments[1];
			return vertices.length/3;
		}
		return 0;
	}
	/** Deconstructors
	--------------------	*/
	AbstractMesh.prototype.deleteBuffers = function() {
		gl.deleteBuffer(this.vbuf);
		gl.deleteBuffer(this.nbuf);
	}
	/** Draw helpers (arguments should remain constant throughout)
	----------------------------------------------------------------	*/
	// Bind and point buffers for this mesh, last bind should be for the buffer that will be drawn
	AbstractMesh.prototype.bindForDraw = function(gl, attributes, cbuf) {
		// Bind and point color buffer, if present
		if(cbuf) {
			gl.bindBuffer(gl.ARRAY_BUFFER, cbuf);
			gl.vertexAttribPointer(attributes.color, 4, gl.FLOAT, false, 0, 0);
		}

		// Bind and point vertex buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
		gl.vertexAttribPointer(attributes.position, 3, gl.FLOAT, false, 0, 0);
	}
	// Loops through uniforms dict and sets each, does not need to be overriden in most cases
	AbstractMesh.prototype.setUniforms = function(uniforms) {
		$.each(uniforms, function(key, uniform) {
			uniform.set();
		});
	}
	// Default drawMesh() is to draw triangles from vertex arrays, usually does not need to be overridden
	AbstractMesh.prototype.drawMesh = function(gl) {
		gl.drawArrays(this.mode, 0, this.length);
	}
	// Default main draw method, uses the above methods in order, usually does not need to be overriden, one of the above should be, preferably
	AbstractMesh.prototype.draw = function(gl, attributes, uniforms, cbuf) {
		// Bind for draw
		this.bindForDraw(gl, attributes, cbuf);
		// Set uniforms
		this.setUniforms(uniforms);
		// Draw mesh
		this.drawMesh(gl);
	}


	/** Abstract Indexed Mesh (AbstractMesh)
	========================================	*/
	AbstractIndexedMesh = function(gl, vertices, normals, indices, usage, mode) {
		// Inherit from AbstractMesh
		AbstractMesh.apply(this, [gl, vertices, normals, usage, mode, /*For getLength()*/indices].concat(Array.prototype.splice.call(arguments, 6)));

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
		if(arguments.length > 5) {
			var indices = arguments[5];
			return indices.length;
		}
		return 0;
	}
	/** Deconstructors
	--------------------	*/
	AbstractIndexedMesh.prototype.deleteBuffers = function() {
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
	Mesh = function(gl, vertices, normals, indices, usage) {
		// Inherit from AbstractIndexedMesh
		AbstractIndexedMesh.apply(this, [gl, vertices, indices, usage, gl.TRIANGLES].concat(Array.prototype.splice.call(arguments, 5)));
	}
	/* Inheritance of prototype
	----------------------------	*/
	Mesh.prototype = Object.create(AbstractIndexedMesh.prototype);
	Mesh.prototype.constructor = Mesh;


	/** LineMesh (AbstractMesh)
	============================	*/
	LinesMesh = function(gl, vertices, usage) {
		// Inherit from AbstractMesh
		AbstractMesh.apply(this, [gl, vertices, usage, gl.LINES].concat(Array.prototype.splice.call(arguments,4)));
	}
	/* Inheritance of prototype
	----------------------------	*/
	LinesMesh.prototype = Object.create(AbstractMesh.prototype);
	LinesMesh.prototype.constructor = LinesMesh;


	/** Exports
	============	*/
	clockgl.Mesh = Mesh;
	clockgl.LinesMesh = LinesMesh;

}(window.clockgl = window.clockgl || {}, jQuery));