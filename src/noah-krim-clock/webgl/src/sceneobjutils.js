/**
	sceneobjutils.js: specialized utilities sceneobjs
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	clockgl.initCircularLayers = function(baseName, layers, layerDistance, initDistance, initAngle) {
		// Set defaults
		initDistance = initDistance || 0.0;
		initAngle = initAngle || 0.0;

		// Construct layers
		var ret = {}
		$.each(layers, function(layerIndex, layer) {
			var layerCount = layer.length;
			var radius = initDistance + layerIndex*layerDistance;
			var angleDiff = 2*Math.PI/layerCount;
			for(var i=0; i<layerCount; i++) {
				var so = layer[i];
				var angle = initAngle + i*angleDiff;
				console.log(so.world);
				so.world.rotateZ(angle).translateY(radius).saveAsBase().rotateZ(-angle);
				console.log(so.world);
				ret[baseName+layerIndex+'L'+i] = so;
			}
		});
		return ret;
	}
	
}(window.clockgl = window.clockgl || {}, jQuery));