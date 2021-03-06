//WARNING: no log() function usage before init.js

exports.core.device = 0
exports.core.vendor = ""

exports.core.trace = { key: false, focus: false, listeners: false }

exports.core.keyCodes = {
	13: 'Select',
	27: 'Back',
	37: 'Left',
	32: 'Space',
	33: 'PageUp',
	34: 'PageDown',
	38: 'Up',
	39: 'Right',
	40: 'Down',
	48: '0',
	49: '1',
	50: '2',
	51: '3',
	52: '4',
	53: '5',
	54: '6',
	55: '7',
	56: '8',
	57: '9',
	65: 'A',
	66: 'B',
	67: 'C',
	68: 'D',
	69: 'E',
	70: 'F',
	71: 'G',
	72: 'H',
	73: 'I',
	74: 'J',
	75: 'K',
	76: 'L',
	77: 'M',
	78: 'N',
	79: 'O',
	80: 'P',
	81: 'Q',
	82: 'R',
	83: 'S',
	84: 'T',
	85: 'U',
	86: 'V',
	87: 'W',
	88: 'X',
	89: 'Y',
	90: 'Z',
	112: 'Red',
	113: 'Green',
	114: 'Yellow',
	115: 'Blue'
}

/* ${init.js} */

if (log === null)
	log = console.log.bind(console)

/** @const */
/** @param {string} text @param {...} args */
_globals.qsTr = function(text, args) { return _globals._context.qsTr.apply(qml._context, arguments) }

var colorTable = {
	'maroon':	'800000',
	'red':		'ff0000',
	'orange':	'ffA500',
	'yellow':	'ffff00',
	'olive':	'808000',
	'purple':	'800080',
	'fuchsia':	'ff00ff',
	'white':	'ffffff',
	'lime':		'00ff00',
	'green':	'008000',
	'navy':		'000080',
	'blue':		'0000ff',
	'aqua':		'00ffff',
	'teal':		'008080',
	'black':	'000000',
	'silver':	'c0c0c0',
	'gray':		'080808',
	'transparent': '0000'
}

var safeCallImpl = function(callback, self, args, onError) {
	try { return callback.apply(self, args) } catch(ex) { onError(ex) }
}

exports.core.safeCall = function(self, args, onError) {
	return function(callback) { return safeCallImpl(callback, self, args, onError) }
}

/**
 * @constructor
 */
var CoreObjectComponent = exports.core.CoreObject = function() { }
var CoreObjectComponentPrototype = CoreObjectComponent.prototype
CoreObjectComponentPrototype.constructor = exports.core.CoreObject
CoreObjectComponentPrototype.__create = function() { }
CoreObjectComponentPrototype.__setup = function() { }


/** @constructor */
var Color = exports.core.Color = function(value) {
	if (Array.isArray(value)) {
		this.r = value[0]
		this.g = value[1]
		this.b = value[2]
		this.a = value[3] !== undefined? value[3]: 255
		return
	}
	if (typeof value !== 'string')
	{
		this.r = this.b = this.a = 255
		this.g = 0
		log("invalid color specification: " + value)
		return
	}
	var triplet
	if (value.substring(0, 4) == "rgba") {
		var b = value.indexOf('('), e = value.lastIndexOf(')')
		value = value.substring(b + 1, e).split(',')
		this.r = parseInt(value[0], 10)
		this.g = parseInt(value[1], 10)
		this.b = parseInt(value[2], 10)
		this.a = Math.floor(parseFloat(value[3]) * 255)
		return
	}
	else {
		var h = value.charAt(0);
		if (h != '#')
			triplet = colorTable[value];
		else
			triplet = value.substring(1)
	}

	if (!triplet) {
		this.r = 255
		this.g = 0
		this.b = 255
		log("invalid color specification: " + value)
		return
	}

	var len = triplet.length;
	if (len == 3 || len == 4) {
		var r = parseInt(triplet.charAt(0), 16)
		var g = parseInt(triplet.charAt(1), 16)
		var b = parseInt(triplet.charAt(2), 16)
		var a = (len == 4)? parseInt(triplet.charAt(3), 16): 15
		this.r = (r << 4) | r;
		this.g = (g << 4) | g;
		this.b = (b << 4) | b;
		this.a = (a << 4) | a;
	} else if (len == 6 || len == 8) {
		this.r = parseInt(triplet.substring(0, 2), 16)
		this.g = parseInt(triplet.substring(2, 4), 16)
		this.b = parseInt(triplet.substring(4, 6), 16)
		this.a = (len == 8)? parseInt(triplet.substring(6, 8), 16): 255
	} else
		throw new Error("invalid color specification: " + value)
}
var ColorPrototype = Color.prototype
ColorPrototype.constructor = exports.core.Color
/** @const */

ColorPrototype.rgba = function() {
	return "rgba(" + this.r + "," + this.g + "," + this.b + "," + (this.a / 255) + ")";
}

exports.core.normalizeColor = function(spec) {
	return (new Color(spec)).rgba()
}

exports.core.mixColor = function(specA, specB, r) {
	var a = new Color(specA)
	var b = new Color(specB)
	var mix = function(a, b, r) { return Math.floor((b - a) * r + a) }
	return [mix(a.r, b.r, r), mix(a.g, b.g, r), mix(a.b, b.b, r), mix(a.a, b.a, r)]
}

/** @constructor */
exports.core.DelayedAction = function(context, action) {
	this.context = context
	this.action = function() {
		this._scheduled = false
		action()
	}.bind(this)
}

exports.core.DelayedAction.prototype.schedule = function() {
	if (!this._scheduled) {
		this._scheduled = true
		this.context.scheduleAction(this.action)
	}
}

exports.addProperty = function(proto, type, name, defaultValue) {
	var convert
	switch(type) {
		case 'enum':
		case 'int':		convert = function(value) { return ~~value }; break
		case 'bool':	convert = function(value) { return value? true: false }; break
		case 'real':	convert = function(value) { return +value }; break
		case 'string':	convert = function(value) { return String(value) }; break
		default:		convert = function(value) { return value }; break
	}

	if (defaultValue !== undefined) {
		defaultValue = convert(defaultValue)
	} else {
		switch(type) {
			case 'enum': //fixme: add default value here
			case 'int':		defaultValue = 0; break
			case 'bool':	defaultValue = false; break
			case 'real':	defaultValue = 0.0; break
			case 'string':	defaultValue = ""; break
			case 'array':	defaultValue = []; break
			case 'Color':	defaultValue = '#0000'; break
			default:
				defaultValue = (type[0].toUpperCase() == type[0])? null: undefined
		}
	}

	var storageName = '__property_' + name
	var forwardName = '__forward_' + name

	Object.defineProperty(proto, name, {
		get: function() {
			var p = this[storageName]
			return p !== undefined?
				p.interpolatedValue !== undefined? p.interpolatedValue: p.value:
				defaultValue
		},

		set: function(newValue) {
			newValue = convert(newValue)
			var p = this[storageName]
			if (p === undefined) { //no storage
				if (newValue === defaultValue) //value == defaultValue, no storage allocation
					return

				p = this[storageName] = { value : defaultValue }
			}
			var backend = this._context.backend
			var animation = this.getAnimation(name)
			if (animation && p.value !== newValue) {
				if (p.frameRequest)
					backend.cancelAnimationFrame(p.frameRequest)

				var now = new Date()
				p.started = now.getTime() + now.getMilliseconds() / 1000.0

				var src = p.interpolatedValue !== undefined? p.interpolatedValue: p.value
				var dst = newValue

				var self = this

				var complete = function() {
					backend.cancelAnimationFrame(p.frameRequest)
					p.frameRequest = undefined
					animation.complete = function() { }
					animation.running = false
					p.interpolatedValue = undefined
					p.started = undefined
					self._update(name, dst, src)
				}

				var duration = animation.duration

				var nextFrame = function() {
					var date = new Date()
					var now = date.getTime() + date.getMilliseconds() / 1000.0
					var t = 1.0 * (now - p.started) / duration
					if (t >= 1) {
						complete()
					} else {
						p.interpolatedValue = convert(animation.interpolate(dst, src, t))
						self._update(name, p.interpolatedValue, src)
						p.frameRequest = backend.requestAnimationFrame(nextFrame)
					}
				}

				p.frameRequest = backend.requestAnimationFrame(nextFrame)

				animation.running = true
				animation.complete = complete
			}
			var oldValue = p.value
			if (oldValue !== newValue) {
				var forwardTarget = this[forwardName]
				if (forwardTarget !== undefined) {
					if (oldValue !== null && (oldValue instanceof Object)) {
						//forward property update for mixins
						var forwardedOldValue = oldValue[forwardTarget]
						if (newValue !== forwardedOldValue) {
							oldValue[forwardTarget] = newValue
							this._update(name, newValue, forwardedOldValue)
						}
						return
					} else if (newValue instanceof Object) {
						//first assignment of mixin
						this.connectOnChanged(newValue, forwardTarget, function(v, ov) { this._update(name, v, ov) }.bind(this))
					}
				}
				p.value = newValue
				if ((!animation || !animation.running) && newValue == defaultValue)
					delete this[storageName]
				if (!animation)
					this._update(name, newValue, oldValue)
			}
		},
		enumerable: true
	})
}

exports.addAliasProperty = function(self, name, getObject, srcProperty) {
	var target = getObject()
	self.connectOnChanged(target, srcProperty, function(value) { self._update(name, value) })

	Object.defineProperty(self, name, {
		get: function() { return target[srcProperty] },
		set: function(value) { target[srcProperty] = value },
		enumerable: true
	})
}

exports.core.createSignal = function(name) {
	return function() { COPY_ARGS(args, 0) this.emitWithArgs(name, args) }
}
exports.core.createSignalForwarder = function(object, name) {
	return (function() { COPY_ARGS(args, 0) object.emitWithArgs(name, args) })
}

/** @constructor */
exports.core.EventBinder = function(target) {
	this.target = target
	this.callbacks = {}
	this.enabled = false
}

exports.core.EventBinder.prototype.on = function(event, callback) {
	if (event in this.callbacks)
		throw new Error('double adding of event (' + event + ')')
	this.callbacks[event] = callback
	if (this.enabled)
		this.target.on(event, callback)
}

exports.core.EventBinder.prototype.constructor = exports.core.EventBinder

exports.core.EventBinder.prototype.enable = function(value) {
	if (value != this.enabled) {
		var target = this.target
		this.enabled = value
		if (value) {
			for(var event in this.callbacks)
				target.on(event, this.callbacks[event])
		} else {
			for(var event in this.callbacks)
				target.removeListener(event, this.callbacks[event])
		}
	}
}

var protoEvent = function(prefix, proto, name, callback) {
	var name = '__' + prefix + '__' + name
	if (name in proto) {
		proto[name] = function() {
			try {
				callback.apply(this, arguments)
			} catch(ex) {
				log('error invoking base prototype event ' + prefix + ':' + name, ex, ex.stack)
			}
		}
	} else
		proto[name] = callback
}

exports.core._protoOn = function(proto, name, callback)
{ protoEvent('on', proto, name, callback) }

exports.core._protoOnChanged = function(proto, name, callback)
{ protoEvent('changed', proto, name, callback) }

exports.core._protoOnKey = function(proto, name, callback)
{ protoEvent('key', proto, name, callback) }
