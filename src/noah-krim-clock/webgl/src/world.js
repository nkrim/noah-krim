/**
	world.js: object to represent to-world matrix for models
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** World object
	================	*/
	var World = function(base, scale, rotation, translation) {
		if(base instanceof World)
			this._base = base.toMatrix();
		else
			this._base = base instanceof Matrix && base.dimensions().rows <= 4 && base.dimensions().cols <= 4 
							? base.ensure4x4() :  Matrix.I(4);
		this._scale = scale instanceof Vector && scale.dimensions() === 3
							? scale : $V([1.0, 1.0, 1.0]);
		this._rot = rotation instanceof Matrix && rotation.dimensions().rows <= 4 && rotation.dimensions().cols <= 4 
							? rotation.ensure4x4() : Matrix.I(4);
		this._trans = translation instanceof Vector && translation.dimensions() === 3
							? translation : Vector.Zero(3);
	}


	/** Properties
	----------------	*/
	Object.defineProperty(World.prototype, 'base', {
		get: function() { 
			return this._base;
		},
		set: function(base) {
			if(base instanceof World) {
				this._base = base.toMatrix();
				return true;
			}
			if(base instanceof Matrix && base.dimensions().rows <= 4 && base.dimensions().cols <= 4) {
				this._base = base;
				return true;
			}
			return false;
		}
	});
	Object.defineProperty(World.prototype, 'scale', {
		get: function() { 
			return this._scale;
		},
		set: function(scale) {
			if(scale instanceof Vector && scale.dimensions() === 3) {
				this._scale = scale;
				return true;
			}
			return false;
		}
	});
	Object.defineProperty(World.prototype, 'rotation', {
		get: function() { 
			return this._rot;
		},
		set: function(rotation) {
			if(rotation instanceof Matrix && rotation.dimensions().rows <= 4 && rotation.dimensions().cols <= 4 ) {
				this._rot = rotation.ensure4x4();
				return true;
			}
			return false;
		}
	});
	Object.defineProperty(World.prototype, 'translation', {
		get: function() { 
			return this._trans;
		},
		set: function(translation) {
			if(translation instanceof Vector && translation.dimensions() === 3) {
				this._trans = translation;
				return true;
			}
			return false;
		}
	});


	/** Modifiers
	----------------	*/
	World.prototype.resetBase = function() {
		this._base = Matrix.I(4);
		return this;
	}
	World.prototype.resetScale = function() {
		this._scale = $V([1.0, 1.0, 1.0]);
		return this;
	}
	World.prototype.resetRotation = function() {
		this._rot = Matrix.I(4);
		return this;
	}
	World.prototype.resetTranslation = function() {
		this._trans = Vector.Zero(3);
		return this;
	}

	World.prototype.saveAsBase = function() {
		this._base = this.toMatrix();
		this.resetScale();
		this.resetRotation();
		this.resetTranslation();
		return this;
	}

	World.prototype.scale = function(s) {
		this._scale.x(s);	
		return this;
	}
	World.prototype.scaleX = function(x) {
		this._scale.elements[0] *= x;
		return this;
	}
	World.prototype.scaleY = function(y) {
		this._scale.elements[1] *= y;
		return this;
	}
	World.prototype.scaleZ = function(z) {
		this._scale.elements[2] *= z;
		return this;
	}

	World.prototype.rotate = function(angle, axis) {
		this._rot = Matrix.Rotation(angle, axis).ensure4x4().x(this._rot);
		return this;
	}
	World.prototype.rotateX = function(angle) {
		this._rot = Matrix.RotationX(angle).ensure4x4().x(this._rot);
		return this;
	}
	World.prototype.rotateY = function(angle) {
		this._rot = Matrix.RotationY(angle).ensure4x4().x(this._rot);
		return this;
	}
	World.prototype.rotateZ = function(angle) {
		this._rot = Matrix.RotationZ(angle).ensure4x4().x(this._rot);
		return this;
	}

	World.prototype.translate = function(v) {
		this._trans = this._trans.add(v);
		return this;
	}
	World.prototype.translateX = function(x) {
		this._trans.elements[0] += x;
		return this;
	}
	World.prototype.translateY = function(y) {
		this._trans.elements[1] += y;
		return this;
	}
	World.prototype.translateZ = function(z) {
		this._trans.elements[2] += z;
		return this;
	}


	/** Convertions
	----------------	*/
	World.prototype.baseMatrix = function() {
		return this._base;
	}
	World.prototype.scaleMatrix = function() {
		return this._scale.toDiagonalMatrix().ensure4x4();
	}
	World.prototype.rotationMatrix = function() {
		return this._rot;
	}
	World.prototype.translationMatrix = function() {
		return Matrix.Translation(this._trans);
	}
	World.prototype.toMatrix = function() {
		return this.translationMatrix().x(this.rotationMatrix()).x(this.scaleMatrix()).x(this.baseMatrix());
	}
	World.prototype.clone = function() {
		return new World($M(this._base), $V(this._scale), $V(this._rot), $V(this._trans));
	}
	World.prototype.cloneAsBase = function() {
		return new World(this.toMatrix());
	}


	/** Exports
	============	*/
	clockgl.World = World;
	
}(window.clockgl = window.clockgl || {}, jQuery));