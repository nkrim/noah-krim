/**
	input.js: handles input for reading by main.js
	author: Noah Krim
*/

(function(clockgl, $, undefined) {

	/** InputHandler object
	========================	*/
	var InputHandler = function(element, preventAutoBind) {
		this.keysHold = {}
		this.keysDown = {};
		this.keysUp = {};
		this._element = element;
		this._isDownBound = false;
		this._isUpBound = false;
		this.bind();
	}

	InputHandler.prototype.bind = function(preventDownBind, preventUpBind) {
		if(!(preventDownBind || this._isDownBound)) {
			$(this._element).keydown(this._keyDownHandler.bind(this));
			this._isDownBound = true;
		}
		if(!(preventUpBind || this._isUpBound)) {
			$(this._element).keyup(this._keyUpHandler.bind(this));
			this._isUpBound = true;
		}
	}

	InputHandler.prototype.unbind = function(preventDownUnbind, preventUpUnbind) {
		if(!preventDownUnbind && this._isDownBound) {
			$(this._element).unbind('keydown');
			this._isDownBound = false;
		}
		if(!preventUpUnbind && this._isUpBound) {
			$(this._element).unbind('keyup');
			this._isUpBound = false;
		}
	}

	InputHandler.prototype.clear = function() {
		this.keysDown = {};
		this.keysUp = {};	
	}

	InputHandler.prototype.performActions = function(actionsHold, actionsDown, actionsUp) {
		actionsHold = actionsHold || {};
		actionsDown = actionsDown || {};
		actionsUp = actionsUp || {};
		var actionsHoldAlways = actionsHold.always;
		var actionsDownAlways = actionsDown.always;
		var actionsUpAlways = actionsUp.always;

		$.each(this.keysHold, function(name, time) {
			if(time) {
				var action = actionsHold[name];
				if(action)
					action(time);
				if(actionsHoldAlways)
					actionHoldAlways(time);
			}
		});
		$.each(this.keysDown, function(name, time) {
			if(time) {
				var action = actionsDown[name];
				if(action)
					action(time);
				if(actionsDownAlways)
					actionDownAlways(time);
			}
		});
		$.each(this.keysUp, function(name, time) {
			if(time) {
				var action = actionsUp[name];
				if(action)
					action(time);
				if(actionsUpAlways)
					actionUpAlways(time);
			}
		});
		this.clear();
	}

	/** Handlers
	------------	*/
	InputHandler.prototype._keyDownHandler = function(event) {
		this.keysDown[event.which] = new Date();
		this.keysHold[event.which] = new Date();
	}
	InputHandler.prototype._keyUpHandler = function(event) {
		delete this.keysHold[event.which];
		this.keysUp[event.which] = new Date();
	}

	/** Exports
	============	*/
	clockgl.InputHandler = InputHandler;
	
}(window.clockgl = window.clockgl || {}, jQuery));