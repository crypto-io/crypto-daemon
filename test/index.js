const test = require('tape');
const CryptoDaemon = require('./../dist/daemon-node.js');
const daemon = new CryptoDaemon();

test('ready', tape => {
  tape.plan(1);
  daemon.on('ready', () => tape.pass('daemon running'));
  try {
    daemon.start();
  } catch (error) {
    tape.fail(error);
  }
});

test('stop', tape => {
  tape.plan(1);
  try {
    daemon.stop();
    tape.pass('daemon stopped');
  } catch (error) {
    tape.fail(error);
  }
});
