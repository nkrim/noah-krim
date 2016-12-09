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
		if(up) {
			console.assert(up instanceof Vector && up.dimensions() === 3, 'Camera up direction expected a vector of length 3, but received: %o', up);
			this._up = up;
		}
		else {
			var squaredUp = Camera.getSquaredUpVector(pos, look);
			console.assert(squaredUp, 'Camera tried to generate a squared up vector but the look direction is parallel or antiparallel to the y-axis');
			this._up = squaredUp;
		}

		// Declare matrix cache
		this._mat;

		// Set cache condition
		this.changed = true;
	}

	Camera.getSquaredUpVector = function(pos, look) {
		var unitLookVec = look.subtract(pos).toUnitVector();
		if(unitLookVec.isParallelTo(Vector.j) || unitLookVec.isAntiparallelTo(Vector.j))
			return null;
		return unitLookVec.cross(Vector.j).cross(unitLookVec).toUnitVector();
	}


	/** Define properties
	------------------------	*/
	// Position
	Object.defineProperty(Camera.prototype, 'pos', {
		get: function() {
			return this._pos;
		},
	});
	// Looking at
	Object.defineProperty(Camera.prototype, 'look', {
		get: function() {
			return this._look;
		},
	});
	// Position
	Object.defineProperty(Camera.prototype, 'up', {
		get: function() {
			return this._up;
		},
	});


	/** Calculatons
	----------------	*/
	Camera.prototype.modelView = function() {
		if(!this.changed)
			return this._mat;
		this._mat = makeLookAt.apply(this, [].concat(this._pos.flatten(), this._look.flatten(), this._up.flatten()));
		this.changed = false;
		return this._mat;
	}

	Camera.prototype.lookVector = function() {
		return this._look.subtract(this._pos);
	}
	Camera.prototype.lookDistance = function() {
		return this._pos.distanceFrom(this._look);
	}

	Camera.prototype.tiltComponent = function() {
		return this.lookVector().cross(this._up);
	}


	/** Transforms
	----------------	*/
	Camera.prototype.setLookDistance = function(distance) {
		var unitLookVec = this.lookVector().toUnitVector();
		this._look = unitLookVec.x(distance).add(this._pos);
	}

	Camera.prototype.turn = function(angle, axis) {
		this._look = this._look.rotate(angle, $L(this._pos, axis));
		this._up = Matrix.Rotation(angle, axis).x(this._up);
		// Flag changed
		this.changed = true;
	}
	Camera.prototype.yaw = function(angle) {
		this._look = this._look.rotate(angle, $L(this._pos, this._up));
		// Flag changed
		this.changed = true;
	}
	Camera.prototype.tilt = function(angle) {
		this.turn(angle, this.tiltComponent());
		// Flag changed from turn() call
	}
	Camera.prototype.roll = function(angle) {
		this._up = Matrix.Rotation(angle, this.lookVector()).x(this._up);
		// Flag changed
		this.changed = true;
	}

	Camera.prototype.move = function(distance, direction) {
		var distanceVec = direction.toUnitVector().x(distance);
		this._pos = this._pos.add(distanceVec);
		this._look = this._look.add(distanceVec);
		// Flag changed
		this.changed = true;
	}
	Camera.prototype.moveTo = function(loc) {
		this.move(loc.distanceFrom(this._pos), loc.subtract(this._pos));
		// Flag changed from move() call
	}
	Camera.prototype.moveX = function(distance) {
		this._pos.elements[0] += distance;
		this._look.elements[0] += distance;
		// Flag changed
		this.changed = true;
	}
	Camera.prototype.moveY = function(distance) {
		this._pos.elements[1] += distance;
		this._look.elements[1] += distance;
		// Flag changed
		this.changed = true;
	}
	Camera.prototype.moveZ = function(distance) {
		this._pos.elements[2] += distance;
		this._look.elements[2] += distance;
		// Flag changed
		this.changed = true;
	}
	Camera.prototype.moveHoriz = function(distance) {
		this.move(distance, this._look.cross(this._up));
		// Flag changed from move() call
	}
	Camera.prototype.moveVert = function(distance) {
		this.move(distance, this._up);
		// Flag changed from move() call
	}
	Camera.prototype.moveForward = function(distance) {
		this.move(distance, this.lookVector());
		// Flag changed from move() call
	}

	Camera.prototype.rotateAround = function(angle, axis, zoom) {
		this._pos = this._pos.rotate(angle, $L(this._look, axis));
		this._up = Matrix.Rotation(angle, axis).x(this._up);
		if(zoom)
			this.zoom(zoom);
		// Flag changed
		this.changed = true;
	}
	Camera.prototype.rotateAroundHoriz = function(angle) {
		this._pos = this._pos.rotate(angle, $L(this._look, this._up));
		// Flag changed
		this.changed = true;
	}
	Camera.prototype.rotateAroundVert = function(angle) {
		this.rotateAround(angle, this.tiltComponent());
		// Flag changed from rotateAround() call
	}

	Camera.prototype.flip = function() {
		this._pos = this._pos.reflectionIn(this._look);
		// Flag changed
		this.changed = true;
	}

	Camera.prototype.zoom = function(distance) {
		var lookDist = this.lookDistance();
		distance = Math.min(lookDist-0.0001, distance);
		this.moveForward(distance);
		this.setLookDistance(lookDist - distance);
		// Flag changed from moveForward() call
	}

	/** Exports
	============	*/
	clockgl.Camera = Camera
	
}(window.clockgl = window.clockgl || {}, jQuery));