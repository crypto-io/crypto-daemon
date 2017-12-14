# crypto-daemon

> The node responsible for connecting to the ipfs network

## Install
### npm
```sh
npm install --save crypto-daemon
```

### yarn
```sh
yarn add crypto-daemon
```

## Example
```js
const CryptoDaemon = require('crypto-daemon');
const daemon = new CryptoDaemon();

daemon.on('ready', () => console.log('daemon running'));
try {
  daemon.start();
} catch (error) {
  console.error(error);
}
```

## API
### methods
#### start
daemon.start()

#### stop
daemon.stop()

### events
ready
error

### private methods
_failsafe
_onClose
_onData
_onError
