/**
	view.js: shader methods
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** Persistent vars
	====================	*/
	var configs = {};

	/** Drawing functions
	========================	*/
	clockgl.drawScene = function(gl, sceneObjs, timeDiff, options, shaderPrograms, sceneUniformsDef, uniformsForce) {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
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

		/** Config inits
	 	--------------------	*/
	 	// VSM config init
	 	if(!configs.vsm)
	 		configs.vsm = vsmInit(gl, 512);

		/** Shader passes
		--------------------	*/
		// VSM shader pass
		vsmPass(gl, sceneObjs, options, shaderPrograms, sceneUniformsDef, uniformsForce);

		// Draw shader pass
		drawPass(gl, sceneObjs, options, shaderPrograms, sceneUniformsDef, uniformsForce);
	}

	/** VSM config init
	--------------------	*/
	function vsmInit(gl, size) {
		/*// Init renderbuffer
		var rbo = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, size, size);
		// Unbind renderbuffer
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);*/

		// Init framebuffer
		var fbo = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		// Unbind framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		// Init texture
		var tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		// Unbind texture
		gl.bindTexture(gl.TEXTURE_2D, null);

		// Attach texture and renderbuffer to framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
		//gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbo);
		// Unbind framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		// Return config
		return {
			size: size,
			tex: tex,
			//rbo: rbo,
			fbo: fbo,
		};
	}
	/** VSM shader pass
	--------------------	*/
	function vsmPass(gl, sceneObjs, options, shaderPrograms, sceneUniformsDef, uniformsForce) {
		// Switch to shader
		shaderPrograms.useProgram(gl, 'vsm');
		// Init scene uniforms
		var sceneUniforms = clockgl._initUniformsFromContextLayout(shaderPrograms.uniformsLayout.scene, sceneUniformsDef.vsm, uniformsForce);

		// Retrieve config.vsm
		var vsmConfig = configs.vsm;

		// Temporarily hide axes, if not already done
		if(!(options.cur.hideAxes || options.old.hideAxes))
			sceneObjs.axes.hide();

		// Bind vsm framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, vsmConfig.fbo);

		// Set viewport
		gl.viewport(0, 0, vsmConfig.size, vsmConfig.size);

		gl.bindTexture(gl.TEXTURE_2D, vsmConfig.tex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, vsmConfig.size, vsmConfig.size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.bindTexture(gl.TEXTURE_2D, null);

		// Clear color buffers
		gl.clearColor(0,1,0,1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.clearColor(0,0,0,1);

		// Draw scene
		/*$.each(sceneObjs, function(key, so) {
			so.draw(gl, shaderPrograms, sceneUniforms, uniformsForce);
		});*/

		// Unbind framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		// Reset viewport
		clockgl._viewportToCanvas(gl);

		// Generate mipmap
		/*gl.bindTexture(gl.TEXTURE_2D, vsmConfig.tex);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);*/

		// Unhide axes if temporary
		if(!(options.cur.hideAxes || options.old.hideAxes))
			sceneObjs.axes.show();
	}

	/** Draw shader pass
	------------------------	*/
	function drawPass(gl, sceneObjs, options, shaderPrograms, sceneUniformsDef, uniformsForce) {
		// Switch to shader
		shaderPrograms.useProgram(gl, 'draw');
		// Init scene uniforms
		var sceneUniforms = clockgl._initUniformsFromContextLayout(shaderPrograms.uniformsLayout.scene, sceneUniformsDef.draw, uniformsForce);
		// Bind and activate texture
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, configs.vsm.tex);
		// Add texture uniform to sceneUniformsDef
		$.extend(sceneUniformsDef.draw, { vsm_tex: 0 });

		// Draw scene
		$.each(sceneObjs, function(key, so) {
			so.draw(gl, shaderPrograms, sceneUniforms, uniformsForce);
		});

		// Unbind texture
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	
}(window.clockgl = window.clockgl || {}, jQuery));