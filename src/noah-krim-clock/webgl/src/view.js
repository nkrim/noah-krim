/**
	view.js: shader methods
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** Drawing functions
	========================	*/
	//clockgl.drawDiffuseStencil = 

	clockgl.drawScene = function(gl, sceneObjs, timeDiff, shaderPrograms, sceneUniformsDef, uniformsForce) {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		var program;
		var scenUniforms;

		/** Draw shader pass
		------------------------	*/
		program = shaderPrograms.draw;
		program.enable(gl);
		sceneUniforms = clockgl._initUniformsFromContextLayout(program.uniformsLayout.scene, sceneUniformsDef, uniformsForce);
		$.each(sceneObjs, function(key, so) {
			var updateRet = so.update(timeDiff);
			if(typeof(updateRet) !== 'undefined')
				console.log(updateRet);
			so.draw(gl, program.attributeLocs, sceneUniforms, program.uniformsLayout, uniformsForce);
		});
	}
	
}(window.clockgl = window.clockgl || {}, jQuery));