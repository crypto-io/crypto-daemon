const test = require('tape');
const daemon = require('./../dist/daemon-node.js');

test('ready', tape => {
  tape.plan(1);
  try {
    daemon.on('ready', () => {tape.pass('daemon running')});
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
