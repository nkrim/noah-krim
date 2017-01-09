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
	clockgl.drawScene = function(gl, sceneObjs, drawingObjs, timeDiff, options, shaderPrograms, sceneUniformsDef, uniformsForce) {
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
	 	// Blur config init
	 	/*if(!configs.blur0)
	 		configs.blur0 = blurInit(gl, 512);
	 	if(!configs.blur1)
	 		configs.blur1 = blurInit(gl, 512);*/
	 	// SAT config init
	 	if(!configs.sat)
	 		console.log(configs.sat = satInit(gl, 512));
	 	// VSM config init
	 	if(!configs.vsm)
	 		configs.vsm = vsmInit(gl, 512);

		/** Shader passes
		--------------------	*/
		// VSM shader pass
		var vsmTex = vsmPass(	gl, configs.vsm, 

								sceneObjs, drawingObjs, options, shaderPrograms, sceneUniformsDef, uniformsForce);

		// Blur shader passes (verticla then horizontal)
		/*var blurPasses = [1.0];
		$.each(blurPasses, function(index, blurSigma) {
			vsmTex = blurPass(	gl, configs.blur0, 
								vsmTex, blurSigma, true, 
								sceneObjs, drawingObjs, options, shaderPrograms, sceneUniformsDef, uniformsForce);
			vsmTex = blurPass(	gl, configs.blur1, 
								vsmTex, blurSigma, false, 
								sceneObjs, drawingObjs, options, shaderPrograms, sceneUniformsDef, uniformsForce);
		});*/

		satTex = satPass(	gl, configs.sat,
							vsmTex, 
							sceneObjs, drawingObjs, options, shaderPrograms, sceneUniformsDef, uniformsForce);

		// Draw shader pass
		drawPass(	gl,
					vsmTex, 
					sceneObjs, drawingObjs, options, shaderPrograms, sceneUniformsDef, uniformsForce);
	}

	/** Generic draw function 
	----------------------------	*/
	function drawObjs(gl, sceneObjs, drawingObjs, shaderPrograms, sceneUniformsShaderDef, uniformsForce) {
		var sceneUniforms = clockgl._initUniformsFromContextLayout(shaderPrograms.uniformsLayout.scene, sceneUniformsShaderDef, uniformsForce);
		$.each(drawingObjs, function(name, draw) {
			if(draw)
				sceneObjs[name].draw(gl, shaderPrograms, sceneUniforms, uniformsForce);
		});
	}


	/** Shader passes/config inits
	================================	*/
	/** Draw shader pass
	------------------------	*/
	function drawPass(gl, vsmTexture, sceneObjs, drawingObjs, options, shaderPrograms, sceneUniformsDef, uniformsForce) {
		// Switch to shader
		shaderPrograms.useProgram(gl, 'draw');

		// Add texture uniform to sceneUniformsDef
		sceneUniformsDef.draw = $.extend({}, sceneUniformsDef.draw, {
			vsm_tex: $V([0]),
		});

		// Activate texture
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, vsmTexture);

		// Draw scene
		drawObjs(gl, sceneObjs, drawingObjs, shaderPrograms, sceneUniformsDef.draw, uniformsForce);

		// Unbind texture
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	/** Blur config init
	------------------------	*/
	function blurInit(gl, resolution) {
		// Init framebuffer
		var fbo = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

		// Init texture
		var tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, resolution, resolution, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.generateMipmap(gl.TEXTURE_2D);
		// Unbind texture
		gl.bindTexture(gl.TEXTURE_2D, null);

		// Attach texture and renderbuffer to framebuffer
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
		// Unbind framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		// Return config
		return {
			res: resolution,
			tex: tex,
			fbo: fbo,
		};
	}
	/** Blur shader pass
	------------------------	*/
	function blurPass(gl, blurConfig, imgTexture, gaussSigma, isVertical, sceneObjs, drawingObjs, options, shaderPrograms, sceneUniformsDef, uniformsForce) {
		// Switch to shader
		shaderPrograms.useProgram(gl, 'blur');

		// Set blur uniforms
		sceneUniformsDef.blur = $.extend({}, sceneUniformsDef.blur, {
			resolution: $V([blurConfig.res]),
			blur_sigma: $V([gaussSigma]),
			is_vertical: isVertical ? clockgl.UNIFORM_TRUE : clockgl.UNIFORM_FALSE,
			img_tex: $V([1]),
		});

		// Bind framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, blurConfig.fbo);

		// Activate texture
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, imgTexture);

		// Set viewport
		gl.viewport(0, 0, blurConfig.res, blurConfig.res);

		// Clear buffers
		var old_clear = gl.getParameter(gl.COLOR_CLEAR_VALUE);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.clearColor.apply(gl, old_clear);

		// Draw quad
		drawObjs(gl, sceneObjs, { quad: true }, shaderPrograms, sceneUniformsDef.blur, uniformsForce);

		// Generate mipmap
		gl.bindTexture(gl.TEXTURE_2D, blurConfig.tex);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);

		// Reset viewport
		clockgl._viewportToCanvas(gl);

		// Unbind framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		return blurConfig.tex;
	}

	/** Copy config init
	------------------------	*/
	function copyInit(gl, resolution) {
		// Init framebuffer
		var fbo = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

		// Init texture
		var tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, resolution, resolution, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.generateMipmap(gl.TEXTURE_2D);
		// Unbind texture
		gl.bindTexture(gl.TEXTURE_2D, null);

		// Attach texture and renderbuffer to framebuffer
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
		// Unbind framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		// Return config
		return {
			res: resolution,
			tex: tex,
			fbo: fbo,
		};
	}
	/** Copy shader pass
	------------------------	*/
	function copyPass(gl, copyConfig, imgTexture, sceneObjs, drawingObjs, options, shaderPrograms, sceneUniformsDef, uniformsForce) {
		// Switch to shader
		shaderPrograms.useProgram(gl, 'copy');

		// Set copy uniforms
		sceneUniformsDef.copy = $.extend({}, sceneUniformsDef.copy, {
			img_tex: $V([1]),
		});

		// Bind framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, copyConfig.fbo);

		// Activate texture
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, imgTexture);

		// Set viewport
		gl.viewport(0, 0, copyConfig.res, copyConfig.res);

		// Clear buffers
		var old_clear = gl.getParameter(gl.COLOR_CLEAR_VALUE);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.clearColor.apply(gl, old_clear);

		// Draw quad
		drawObjs(gl, sceneObjs, { quad: true }, shaderPrograms, sceneUniformsDef.copy, uniformsForce);

		// Generate mipmap
		gl.bindTexture(gl.TEXTURE_2D, copyConfig.tex);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);

		// Reset viewport
		clockgl._viewportToCanvas(gl);

		// Unbind framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		return copyConfig.tex;
	}

	/** SAT config init
	------------------------	*/
	function satInit(gl, resolution) {
		// Shader names to use for passes
		var shaderNames = ['sat', 'sat_m'];

		return $.map(shaderNames, function(name) {
			// Init framebuffer
			var fbo = gl.createFramebuffer();
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

			// Init texture
			var tex = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, resolution, resolution, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
			gl.generateMipmap(gl.TEXTURE_2D);
			// Unbind texture
			gl.bindTexture(gl.TEXTURE_2D, null);

			// Attach texture and renderbuffer to framebuffer
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
			// Unbind framebuffer
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);

			// Push pass config onto return array
			return {
				shader: name,
				res: resolution,
				tex: tex,
				fbo: fbo,
			};
		});
	}
	/** SAT shader pass
	------------------------	*/
	function satPass(gl, satConfig, imgTexture, sceneObjs, drawingObjs, options, shaderPrograms, sceneUniformsDef, uniformsForce) {
		// Set copy uniforms
		sceneUniformsDef.sat = $.extend({}, sceneUniformsDef.sat, {
			img_tex: $V([1]),
		});
		sceneUniformsDef.sat_m = $.extend({}, sceneUniformsDef.sat_m, {
			img_tex: $V([1]),
		});

		// Set and save color buffer params
		var old_clear = gl.getParameter(gl.COLOR_CLEAR_VALUE);
		gl.clearColor(0.0, 0.0, 0.0, 0.0);

		// Use input texture as source
		var prevTex = imgTexture;

		// Do sat passes
		for(var i=0; i<2; i++) {
			$.each(satConfig, function(index, config) {
				// Switch to shader
				shaderPrograms.useProgram(gl, config.shader);

				// Bind framebuffer
				gl.bindFramebuffer(gl.FRAMEBUFFER, config.fbo);

				// Activate texture
				gl.activeTexture(gl.TEXTURE1);
				gl.bindTexture(gl.TEXTURE_2D, prevTex);

				// Set viewport
				gl.viewport(0, 0, config.res, config.res);

				// Clear buffers
				gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

				// Draw quad
				drawObjs(gl, sceneObjs, { quad: true }, shaderPrograms, sceneUniformsDef[config.shader], uniformsForce);

				// Generate mipmap
				gl.bindTexture(gl.TEXTURE_2D, config.tex);
				gl.generateMipmap(gl.TEXTURE_2D);
				gl.bindTexture(gl.TEXTURE_2D, null);

				// Unbind framebuffer
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);

				// Set texture for next pass
				prevTex = config.tex;
			});
		}

		// Restore clear color
		gl.clearColor.apply(gl, old_clear);

		// Reset viewport
		clockgl._viewportToCanvas(gl);

		return prevTex;
	}

	/** VSM config init
	--------------------	*/
	function vsmInit(gl, resolution) {
		// Init framebuffer
		var fbo = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

		// Init texture
		var tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, resolution, resolution, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.generateMipmap(gl.TEXTURE_2D);
		// Unbind texture
		gl.bindTexture(gl.TEXTURE_2D, null);

		// Init renderbuffer
		var rbo = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, resolution, resolution);
		// Unbind renderbuffer
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);

		// Attach texture and renderbuffer to framebuffer
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbo);
		// Unbind framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		// Return config
		return {
			res: resolution,
			tex: tex,
			rbo: rbo,
			fbo: fbo,
		};
	}
	/** VSM shader pass
	--------------------	*/
	function vsmPass(gl, vsmConfig, sceneObjs, drawingObjs, options, shaderPrograms, sceneUniformsDef, uniformsForce) {
		// Switch to shader
		shaderPrograms.useProgram(gl, 'vsm');

		// Temporarily hide axes, if not already done
		if(!(options.cur.hideAxes || options.old.hideAxes))
			sceneObjs.axes.hide();

		// Bind vsm framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, vsmConfig.fbo);

		// Set viewport
		gl.viewport(0, 0, vsmConfig.res, vsmConfig.res);

		// Clear buffers
		var old_clear = gl.getParameter(gl.COLOR_CLEAR_VALUE);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.clearColor.apply(gl, old_clear);

		// Draw scene
		drawObjs(gl, sceneObjs, drawingObjs, shaderPrograms, sceneUniformsDef.vsm, uniformsForce);

		// generate mipmap and set MIN_LOD on texture to 2 for reading 
		gl.bindTexture(gl.TEXTURE_2D, vsmConfig.tex);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);

		// Unbind framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		// Reset viewport
		clockgl._viewportToCanvas(gl);

		// Unhide axes if temporary
		if(!(options.cur.hideAxes || options.old.hideAxes))
			sceneObjs.axes.show();

		return vsmConfig.tex;
	}

	
}(window.clockgl = window.clockgl || {}, jQuery));