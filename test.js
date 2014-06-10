var cooperator = require('./')
var sleep = require('co-sleep')
var co = cooperator(function*() {
	yield 'foo'
	yield sleep(2000)
	yield 'bar'
	yield sleep(2000)
	yield 'baz'
}).on('data', function(data) {
	console.log('data', data)
}).on('error', function(err) {
	console.error('error', err.stack)
}).on('done', function(res) {
	console.log('done', res)
}).start()
// yields
// data foo
// data bar
// data baz
// done undefined