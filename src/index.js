'use strict';
import {spawn} from 'child_process';
import { log, stopAndPersist, succes, info, fail } from 'crypto-logger';
import EventEmitter from 'events';
import { read, write } from 'crypto-io-utils';
import { homedir } from 'os';
import { join } from 'path';
const emitter = new EventEmitter();
const home = join(homedir(), '.crypto');
const daemondir = join(home, 'daemon');
const lockPath = join(daemondir, '.lock');
const ipfsPath = join(home, 'ipfs/ipfs');

export default class CryptoDaemon extends EventEmitter {
  constructor() {
    super();
    // Bind methods
    this._onData = this._onData.bind(this);
    this._onError = this._onError.bind(this);
    this._onClose = this._onClose.bind(this);
  }

  start() {
    return new Promise((resolve, reject) => {
      if (process.env.DEBUG) {
        log('checking for other daemons');
      }
      read(lockPath, 'string').then(value => {
        if (Boolean(value === 'true')) {
          // CRYPTODAEMON DAEMON ALREADY RUNNING
          fail('Another daemon is already running')
          reject({code: 'CRYPD_DAR', error: 'Another daemon is already running'});
        } else {
          this._start();
          resolve();
        }
      }).catch(error => {
        this._start();
        resolve();
      });
    });
  }

  stop() {
    write(lockPath, false).then(() => {
      log('killing Daemon');
      this.ipfs.kill();
    });
  }

  _start() {
    log('Starting Daemon');
    this.ipfs = spawn(ipfsPath, ['daemon']);
    this.ipfs.stdout.on('data', this._onData);
    this.ipfs.stderr.on('data', this._onError);
    this.ipfs.on('close', this._onClose);
  }

  _onClose(code) {
    if (process.env.DEBUG) {
      console.log(`child process exited with code ${code}`)
    }
  }

  _onData(data) {
    const isReady = data.toString().includes('Daemon is ready');
    if (isReady) {
      succes('Daemon started');
      this.emit('ready');
      write(lockPath, true);
    };
  }


  _failsafe() {
    fail('cannot acquire lock');
    info('removing lock from repo');
    const unlock = spawn(ipfsPath, ['repo', 'fsck'])
    unlock.stdout.on('data', data => {
      info('Restarting Daemon');
      return this.start();
    })
  }

  _onError(data) {
    const string = data.toString();
    if (string.includes('cannot acquire lock')) {
      this._failsafe();
    } else {
      if (process.env.DEBUG) {
        console.log(string);
      }
      this.emit('error', string);
    }
  }
}
