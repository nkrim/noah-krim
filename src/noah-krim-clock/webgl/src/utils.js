/**
	utils.js: miscellanious helper functions w/ no dependencies to other clockgl files
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** List utils
	================	*/
	clockgl.chunk = function(n, arr) {
		var ret = [];
		for(var i=0; i<arr.length;) {
			ret = ret.concat([arr.slice(i,(i+=n))]);
		}
		return ret;
	}
	clockgl.dechunk = function(arr) {
		return Array.prototype.concat.apply([], arr);
	}
	clockgl.repeat = function(n, rep) {
		var ret = [];
		for(var i=0; i<n; i++) {
			ret = ret.concat(rep);
		}
		return ret;
	}


	/** Obj utils
	================	*/
	clockgl.mapObj = function(obj, mapper) {
		var ret = {};
		$.each(obj, function(key, val) {
			ret[key] = mapper(val, key);
		});
		return ret;
	}
	clockgl.filterObj = function(obj, filter) {
		var ret = {};
		$.each(obj, function(key, val) {
			if(filter(val, key))
				ret[key] = val;
		});
		return ret;
	}


	/** Object utils
	====================	*/
	


	/** Math utils
	================	*/
	clockgl.radians = function(degrees) {
		return degrees * (Math.PI/180.0);
	}
	clockgl.degrees = function(radians) {
		return radians * (180.0/Math.PI);
	}


	/** LinAlg utils
	====================	*/
	clockgl.halfAngleDir = function(v, u) {
		if(v.isParallelTo(u))
			return v.toUnitVector();
		if(v.isAntiparallelTo(u))
			return Vector.Zero(3);
		return Matrix.Rotation(v.angleFrom(u)/2, v.cross(u)).x(v).toUnitVector();
	}
	
}(window.clockgl = window.clockgl || {}, jQuery));