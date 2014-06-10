const pushable = require('pull-pushable')
const thunkifyer = require('thunkifyer')
const util     = require('util')
const EE       = require('events').EventEmitter

function cooperator(gen) {
	if(!(this instanceof cooperator)) {
		return new cooperator(gen)
	}

	EE.call(this)

	if(isGeneratorFunction(gen)) {
		gen = gen()
	}

	this.gen = gen
	this.pullStream = pushable()
}
util.inherits(cooperator, EE)

;(function() {
	this.start = function() {
		if(this.started) {
			throw new Error('already started')
		}
		this.started = true
		this._send()

		return this
	}

	this._send = function(val) {
		try {
			this._handle(this.gen.next(val))
		} catch(e) {
			this.emit('error', e)
		}
	}

	this._throw = function(err) {
		try {
			this._handle(this.gen.throw(err))
		} catch(e) {
			this.emit('error', e)
		}
	}

	this._handle = function(res) {
		try {
			var self = this

			if(res.done) {
				self.emit('done', res.value)
				// the return value shouldn't be emitted
				// self.pullStream.push(res.value)
				self.pullStream.end()
				return
			}

			res = res.value

			// if(Array.isArray(res) && res[0] == 'echo') {
			// 	self._send(res[1])
			// 	return
			// }
			// if(Array.isArray(res) && res[0] == 'error') {
			// 	self._throw(res[1])
			// 	return
			// }
			
			if(isGeneratorFunction(res)) {
				res = res()
			}

			try {
				res = thunkifyer(res)
			} catch(e) {}

			if(isGenerator(res)) {
				cooperator(res).on('done', function(val) {
					self._send(val)
				}).on('error', function(err) {
					self._throw(err)
				}).start()
				return
			} else if(thunkifyer.is(res)) {
				res(function(err, res) {
					// TODO: what if there are multiple arguments
					if(err) {
						self._throw(err)
					} else {
						self._send(res)
					}
				})
			} else {
				self.emit('data', res)
				self.pullStream.push(res)
				self._send()
			}
		} catch(e) {
			if(res.done) {
				throw e
			} else {
				self._throw(e)
			}
		}
	}
}).call(cooperator.prototype)

cooperator.wrap = function(fn, thisVal) {
	var res = function() {
		var args = [].slice.call(arguments)

		return function(cb) {
			return cooperator(fn.apply(thisVal, args)).on('error', function(err) {
				if(cb)
					cb(err)
				else
					throw err
			}).on('done', function(val) {
				if(cb)
					cb(null, val)
			}).start()
		}
	}
	// res.nocb = function() {
	// 	return res.apply(null, [].slice.call(arguments))(function(err, val) {
	// 		if(err) {
	// 			throw err
	// 		}
	// 	})
	// }
}

function isGeneratorFunction(val) {
	return val && val.constructor && val.constructor.name == 'GeneratorFunction'
}

function isGenerator(val) {
	return val && typeof(val.next) == 'function' && typeof(val.throw) == 'function'
}

module.exports = cooperator