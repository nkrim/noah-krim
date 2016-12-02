/**
	camera.js: object representation of camera
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** Camera object
	====================	*/
	var Camera = function(pos, look, up) {
		// Assert and set values;
		console.assert(pos instanceof Vector && pos.dimensions() === 3, 'Camera position expected a vector of length 3, but received: %o', pos);
		this._pos = pos;
		console.assert(look instanceof Vector && look.dimensions() === 3, 'Camera look direction expected a vector of length 3, but received: %o', look);
		this._look = look;
		console.assert(up instanceof Vector && up.dimensions() === 3, 'Camera up direction expected a vector of length 3, but received: %o', up);
		this._up = up;

		// Declare matrix cache
		this._mat;

		// Set cache condition
		this.changed = true;
	}



	/** Define properties
	------------------------	*/
	// Matrix representation
	Object.defineProperty(Camera.prototype, 'mat', { 
		get: function() { 
			if(!this.changed)
				return this._mat;
			this._mat = makeLookAt.apply(this, [].concat(this._pos.flatten(), this._look.flatten(), this._up.flatten()));
			this.changed = false;
			return this._mat;
		},
	});
	// Position
	Object.defineProperty(Camera.prototype, 'pos', {
		get: function() {
			return this._pos;
		},
		set: function(pos) {
			console.assert(pos instanceof Vector && pos.dimensions() === 3, 'Camera position expected a vector of length 3, but received: %o', pos);
			this._pos = pos;
			return this._pos;
		},
	});
	// Looking at
	Object.defineProperty(Camera.prototype, 'look', {
		get: function() {
			return this._look;
		},
		set: function(look) {
			console.assert(look instanceof Vector && look.dimensions() === 3, 'Camera look direction expected a vector of length 3, but received: %o', look);
			this._look = look;
			return this._look;
		},
	});
	// Position
	Object.defineProperty(Camera.prototype, 'up', {
		get: function() {
			return this._up;
		},
		set: function(up) {
			console.assert(up instanceof Vector && up.dimensions() === 3, 'Camera up direction expected a vector of length 3, but received: %o', up);
			this._up = up;
			return this._up;
		},
	});

	/** Transforms
	================	*/

	/** Exports
	============	*/
	clockgl.Camera = Camera
	
}(window.clockgl = window.clockgl || {}, jQuery));