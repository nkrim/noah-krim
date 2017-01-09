/**
	clock.js: SceneObj implementation for clocks
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** Clock object
	====================	*/
	var Clock = function(gl, handMesh, clockFrameMesh, clockFaceMesh, world, sceneObjUniformsDef) {
		// Models def
		var models = {
			handShort: 	new clockgl.Model(gl, 	handMesh, 
												$V([0.9, 0.9, 0.9, 1]), 
												new clockgl.World(null, $V([0.85, 0.8, 0.5]), null, $V([0, 0, 6.0])), 
												{ 	
													specular_exp: $V([1]),
													specular_int: $V([0.3]),
												}
										),
			handLong: 	new clockgl.Model(gl, 	handMesh, 
												$V([0.9, 0.9, 0.9, 1]), 
												new clockgl.World(null, $V([0.85, 0.95, 0.5]), null, $V([0, 0, 1.0])), 
												{ 	
													specular_exp: $V([1]),
													specular_int: $V([0.3]),
												}
										),
			clockFrame: new clockgl.Model(gl, 	clockFrameMesh, 
												$V([0.9, 0.9, 0.9, 1]), 
												null, 
												{ 	
													specular_exp: $V([4]),
												}
										),
			clockFace: 	new clockgl.Model(gl, 	clockFaceMesh, 
												$V([0.2, 0.2, 0.2, 1]), 
												null, 
												{ 	
													specular_exp: $V([16]),
													specular_int: $V([0.5]),
												}
										),
		};

		// Model options layout/def
		var modelOptionsLayout = {

		};
		var modelOptionsDef = {

		};

		// Inherit SceneObj
		clockgl.SceneObj.call(this, models, world, modelOptionsLayout, modelOptionsDef, sceneObjUniformsDef, update);
	}


	/** Inherit prototype
	------------------------	*/
	Clock.prototype = Object.create(clockgl.SceneObj.prototype);
	Clock.prototype.constructor = Clock;


	/** Clock functions
	------------------------	*/



	/** Update function
	--------------------	*/
	var update = function(timeDiff) {
		var secondsSpeed = -timeDiff * Math.PI / 500;
		this.models.handLong.model.world.rotateZ(secondsSpeed);
		this.models.handShort.model.world.rotateZ(secondsSpeed / 6);
	}


	/** Exports
	============	*/
	clockgl.ClockObj = Clock;
	
}(window.clockgl = window.clockgl || {}, jQuery));