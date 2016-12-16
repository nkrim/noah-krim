/**
	view.js: shader methods
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** Drawing functions
	========================	*/
	//clockgl.drawDiffuseStencil = 

	clockgl.drawScene = function(gl, sceneObjs, timeDiff, options, shaderPrograms, sceneUniformsDef, uniformsForce) {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		var scenUniforms;

		/** Perform options
		--------------------	*/
		// hideAxes
		if('hideAxes' in options.cur) {
			if(options.cur.hideAxes)
				sceneObjs.axes.hide();
			else {
				sceneObjs.axes.show();
				options.old.hideAxes = false; // To simplify later checks, do not need to save old, only need current context unless unchanged
			}
		}

		/** Update sceneObjs
		------------------------	*/
		$.each(sceneObjs, function(key, so) {
			var updateRet = so.update(timeDiff);
			if(typeof(updateRet) !== 'undefined')
				console.log(updateRet);
		});

		/** Shader passes
		--------------------	*/
		// VSM shader pass
		var vsmTex = vsmPass(gl, sceneObjs, options, shaderPrograms, sceneUniformsDef, uniformsForce);

		// Draw shader pass
		//drawPass(gl, sceneObjs, options, shaderPrograms, sceneUniformsDef, uniformsForce);
	}


	/** Draw shader pass
	------------------------	*/
	function drawPass(gl, sceneObjs, options, shaderPrograms, sceneUniformsDef, uniformsForce) {
		// Init shader and scene uniforms
		shaderPrograms.useProgram(gl, 'draw');
		sceneUniforms = clockgl._initUniformsFromContextLayout(shaderPrograms.uniformsLayout.scene, sceneUniformsDef.draw, uniformsForce);

		// Draw scene
		$.each(sceneObjs, function(key, so) {
			so.draw(gl, shaderPrograms, sceneUniforms, uniformsForce);
		});
	}


	/** VSM shader pass
	--------------------	*/
	var vsmSize = 512;
	function vsmPass(gl, sceneObjs, options, shaderPrograms, sceneUniformsDef, uniformsForce) {
		// Init shader and scene uniforms
		shaderPrograms.useProgram(gl, 'vsm');
		sceneUniforms = clockgl._initUniformsFromContextLayout(shaderPrograms.uniformsLayout.scene, sceneUniformsDef.vsm, uniformsForce);

		// Temporarily hide axes, if not already done
		if(!(options.cur.hideAxes || options.old.hideAxes))
			sceneObjs.axes.hide();

		/*// Init framebuffer for drawing shadow map
		var vsmFbo = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, vsmFbo);
		// Init texture for drawing shadow map
		var vsmTex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, vsmTex);
		//gl.generateMipmap(gl.TEXTURE_2D);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, vsmSize, vsmSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		// Attach texture to framebuffer
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, vsmTex, gl.TEXTURE_2D, vsmTex, 0);
		// Unbind texture
		gl.bindTexture(gl.TEXTURE_2D, null);
		console.log(vsmTex);*/

		// Draw scene
		$.each(sceneObjs, function(key, so) {
			so.draw(gl, shaderPrograms, sceneUniforms, uniformsForce);
		});
		//console.log(vsmTex);

		// Unbind framebuffer
		//gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		// Unhide axes if temporary
		if(!(options.cur.hideAxes || options.old.hideAxes))
			sceneObjs.axes.show();
	}
	
}(window.clockgl = window.clockgl || {}, jQuery));