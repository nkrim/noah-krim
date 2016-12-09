/**
	sceneobj.js: object representing a collection of models which should be inherited with custom object specific actions applied
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** Base SceneObj definition
	===============================	*/
	var SceneObj = function(models, world, modelOptionsDef, modelOptionsLayout) {
		// Assign defaults
		modelOptionsDef = modelOptionsDef || {};
		// Add define options definition
		modelOptionsLayout = $.extend({
			hide: false,
			cceneWorld: true,
		}, modelOptionLayout || {});
		// Create models dictionary with options
		this.models = clockgl.mapObj(models, function(model, name) {
			return $.extend({model: model}, modelOptionLayout, modelOptionsDef[name] || {});
		});

		// Set world matrix
		this.world = world || new World();
	}


	/* Abstract methods
	--------------------	*/
	SceneObj.prototype.getUniformsDef = function() {
		return {
			objWorld: this.world.toMatrix();
		};
	}
	SceneObj.prototype.drawModelObj = function(modelObj, gl, attributes, uniforms, uniformsLayout) {
		// Pre-draw actions
		if(modelObj.hide)
			return;
		if(!sceneWorld)
			uniforms = $.extend({}, uniforms, {objWorld: Matrix.I(4)});
		// Draw
		modelObj.model.draw(gl, attributes, uniforms, uniformsLayout);
		// Post-draw actions
	}


	/** Base methods
	----------------	*/
	SceneObj.prototype.draw = function(gl, attributes, uniforms, uniformsLayout) {
		// Add sceneobj uniforms/defaults to uniforms dict
		var sceneObjUniformsDef = this.getUniformsDef();
		$.extend(uniforms, clockgl._initUniformsFromContextLayout(uniformsLayout.model, scenObjUniformsDef);
		// Draw models
		$.each(this.models, function(modelObj) {
			this.drawModelObj(modelObj, gl, attributes, uniforms, uniformsLayout);
		});
	}

	
}(window.clockgl = window.clockgl || {}, jQuery));