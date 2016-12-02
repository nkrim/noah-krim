/**
	utils.js: miscellanious helper functions w/ no dependencies to other clockgl files
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

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

	clockgl.mapObj = function(obj, mapper) {
		return $.extend.apply(this, [{}].concat(
			$.map(obj, function(val, key) {
				var ret = {};
				ret[key] = mapper(val, key);
				return ret;
			})
		));
	}
	
}(window.clockgl = window.clockgl || {}, jQuery));