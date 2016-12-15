/**
	sceneobj.js: object representing a collection of models which should be inherited with custom object specific actions applied
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** Base SceneObj definition
	===============================	*/
	var SceneObj = function(models, world, modelOptionsLayout, modelOptionsDef, sceneObjUniformsDef, updateFunc) {
		// Assign defaults
		models = models || {};
		world = world || new clockgl.World;
		modelOptionsDef = modelOptionsDef || {};
		modelOptionsLayout = modelOptionsLayout || {};
		// Add define options definition
		modelOptionsLayout = $.extend({
			hide: false,
			sceneWorld: true,
		}, modelOptionsLayout);
		// Create models dictionary with options
		this.models = clockgl.mapObj(models, function(model, name) {
			return $.extend({model: model}, modelOptionsLayout, modelOptionsDef[name] || {});
		});

		// Set world matrix
		this.world = world;

		// Set uniforms definition
		this.uniformsDef = sceneObjUniformsDef || {};

		// Set updateFunc
		this.updateFunc = updateFunc || function() {};
	}


	/* Abstract methods
	--------------------	*/
	SceneObj.prototype.getUniformsDef = function() {
		return {
			objWorld: this.world.toMatrix(),
		};
	}
	SceneObj.prototype.drawModelObj = function(modelObj, gl, attributes, uniforms, uniformsLayout, uniformsForce) {
		// Pre-draw actions
		if(modelObj.hide)
			return;
		if(!modelObj.sceneWorld)
			uniforms = $.extend({}, uniforms, {objWorld: Matrix.I(4)});
		// Draw
		modelObj.model.draw(gl, attributes, uniforms, uniformsLayout, uniformsForce);
		// Post-draw actions
	}
	SceneObj.prototype.update = function(time) {
		return this.updateFunc(time);
	}


	/** Base methods
	----------------	*/
	SceneObj.prototype.draw = function(gl, attributes, uniforms, uniformsLayout, uniformsForce) {
		// Add sceneobj uniforms/defaults to uniforms dict
		var sceneObjUniformsDef = $.extend(this.getUniformsDef(), this.uniformsDef);
		$.extend(uniforms, clockgl._initUniformsFromContextLayout(uniformsLayout.sceneObj, sceneObjUniformsDef, uniformsForce.sceneObj));
		// Draw models
		$.each(this.models, (function(name, modelObj) {
			this.drawModelObj(modelObj, gl, attributes, uniforms, uniformsLayout, uniformsForce);
		}).bind(this));
	}


	/** Exports
	============	*/
	clockgl.SceneObj = SceneObj;
	
}(window.clockgl = window.clockgl || {}, jQuery));