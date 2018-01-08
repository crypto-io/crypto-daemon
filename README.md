# crypto-daemon

[![Travis branch](https://img.shields.io/travis/crypto-io/crypto-daemon/master.svg?style=for-the-badge)](https://travis-ci.org/crypto-io/crypto-daemon)
[![npm](https://img.shields.io/npm/dt/crypto-daemon.svg?style=for-the-badge)](https://www.npmjs.com/package/crypto-daemon)
[![David](https://img.shields.io/david/crypto-io/crypto-daemon.svg?style=for-the-badge)](https://github.com/crypto-io/crypto-daemon)
[![npm](https://img.shields.io/npm/v/crypto-daemon.svg?style=for-the-badge)](https://www.npmjs.com/package/crypto-daemon)

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
const daemon = require('crypto-daemon');

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
