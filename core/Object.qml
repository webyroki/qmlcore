///the most basic QML Object, generic event emitter, properties and id links holder
EventEmitter {
	///@private
	constructor: {
		this.parent = parent
		this.children = []

		this._context = parent? parent._context: null
		this._local = {}
		if (_delegate === true)
			this._local['_delegate'] = this
		this._changedHandlers = {}
		this._changedConnections = []
		this._pressedHandlers = {}
		this._animations = {}
		this._updaters = {}
	}

	/// discard object
	function discard() {
		this._changedConnections.forEach(function(connection) {
			connection[0].removeOnChanged(connection[1], connection[2])
		})
		this._changedConnections = []

		this.children.forEach(function(child) { child.discard() })
		this.children = []

		this.parent = null
		this._local = {}
		this._changedHandlers = {}
		this._pressedHandlers = {}
		this._animations = {}
		//for(var name in this._updaters) //fixme: it was added once, then removed, is it needed at all? it double-deletes callbacks
		//	this._removeUpdater(name)
		this._updaters = {}

		_globals.core.EventEmitter.prototype.discard.apply(this)
	}

	/**@param child:Object object to add
	adds child object to children*/
	function addChild(child) {
		this.children.push(child);
	}

	/// @private sets id
	function _setId(name) {
		var p = this;
		while(p) {
			p._local[name] = this;
			p = p.parent;
		}
	}

	///@private register callback on property's value changed
	function onChanged(name, callback) {
		if (name in this._changedHandlers)
			this._changedHandlers[name].push(callback);
		else
			this._changedHandlers[name] = [callback];
	}

	///@private
	function connectOnChanged(target, name, callback) {
		target.onChanged(name, callback)
		this._changedConnections.push([target, name, callback])
	}

	///@private removes 'on changed' callback
	function removeOnChanged(name, callback) {
		if (name in this._changedHandlers) {
			var handlers = this._changedHandlers[name];
			var idx = handlers.indexOf(callback)
			if (idx >= 0)
				handlers.splice(idx, 1)
			else
				log('failed to remove changed listener for', name, 'from', this)
		}
	}

	/// @private removes dynamic value updater
	function _removeUpdater (name, newUpdaters) {
		var updaters = this._updaters
		var oldUpdaters = updaters[name]
		if (oldUpdaters !== undefined) {
			oldUpdaters.forEach(function(data) {
				var object = data[0]
				var name = data[1]
				var callback = data[2]
				object.removeOnChanged(name, callback)
			})
		}

		if (newUpdaters)
			updaters[name] = newUpdaters
		else
			delete updaters[name]
	}

	///@private registers key handler
	function onPressed (name, callback) {
		var wrapper
		if (name != 'Key')
			wrapper = function(key, event) { event.accepted = true; callback(key, event); return event.accepted }
		else
			wrapper = callback;

		if (name in this._pressedHandlers)
			this._pressedHandlers[name].push(wrapper);
		else
			this._pressedHandlers[name] = [wrapper];
	}

	///@private
	function _update (name, value) {
		var proto_callback = this['__changed__' + name]
		var handlers = this._changedHandlers[name]

		if (proto_callback === undefined && handlers === undefined)
			return

		var invoker = _globals.core.safeCall(this, [value], function(ex) { log("on " + name + " changed callback failed: ", ex, ex.stack) })

		if (proto_callback !== undefined)
			invoker(proto_callback)

		if (handlers !== undefined)
			handlers.forEach(invoker)
	}

	///@private gets object by id
	function _get (name) {
		if (name in this)
			return this[name]

		var object = this
		while(object) {
			if (name in object._local)
				return object._local[name]
			object = object.parent
		}

		throw new Error("invalid property requested: '" + name)
	}

	///@private sets animation on given property
	function setAnimation (name, animation) {
		this._animations[name] = animation;
	}

	///@private gets animation on given property
	function getAnimation (name, animation) {
		var a = this._animations[name]
		return (a && a.enabled())? a: null;
	}

	///@private called to test if the component can have focus, generic object cannot be focused, so return false, override it to implement default focus policy
	function _tryFocus () { return false }
}
