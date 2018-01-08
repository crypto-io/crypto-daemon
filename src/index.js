'use strict';
import { spawn } from 'child_process';
import { log, stopAndPersist, succes, info, fail } from 'crypto-logger';
import EventEmitter from 'events';
import { homedir } from 'os';
import { join } from 'path';
const home = join(homedir(), '.crypto-io');
const ipfsPath = join(home, 'ipfs/ipfs');
const emitter = new EventEmitter();

let ipfs;

const _failsafe = () => {
  info('removing lock from repo');
  const unlock = spawn(ipfsPath, ['repo', 'fsck'])
  unlock.stdout.on('data', data => {
    info('Restarting Daemon');
    return start();
  })
}

export const on = (name, cb) => {
  emitter.on(name, cb)
}

export const start = () => {
  log('Starting Daemon');
  ipfs = spawn(ipfsPath, ['daemon']);

  ipfs.stdout.on('data', data => {
    const string = data.toString();
    const isReady = string.includes('Daemon is ready');
    if (isReady) {
      if (string.includes('Gateway')) {
        const parts = string.split('Daemon is ready');
        info(parts[0]);
        succes('Daemon is ready');
      } else {
        succes(data);
      }
      emitter.emit('ready');
    } else {
      info(data);
    }
  });

  ipfs.stderr.on('data', data => {
    const string = data.toString();
    if (string.includes('cannot acquire lock')) {
      fail('cannot acquire lock');
      return _failsafe();
    } else {
      if (process.env.DEBUG) {
        console.log(string);
      }
      fail(data);
    }
  });

  ipfs.on('close', code => {
    if (process.env.DEBUG) console.log(`child process exited with code ${code}`);
  });
};

export const stop = () => {
  log('killing Daemon');
  ipfs.kill();
}
