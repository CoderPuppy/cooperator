# Cooperator

## Usage
```javascript
var cooperator = require('cooperator')
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
```

## API
- `co = cooperator(gen)` - Creates a cooperator from gen (can be a generator or a generator function)
- `co.start()` - Start it
- `co.on('data', (data) => {})` - An event emitted when the generator yields a value that can't be thunkifyered
- `co.on('done', (res) => {})` - An event emitted when the generator returns
- `co.on('error', (err) => {})` - An event emitted when the generator throws an error
- `co.pullStream` - A pull-stream for the data