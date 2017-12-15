'use strict';
import {spawn} from 'child_process';
import { log, stopAndPersist, succes, info, fail } from 'crypto-logger';
import EventEmitter from 'events';
import { read, write } from 'crypto-io-utils';
import { homedir } from 'os';
const emitter = new EventEmitter();

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
        console.log('checking for other daemons');
      }
      read(`${homedir()}/.crypto.daemon.locked`, 'string').then(value => {
        if (Boolean(value === 'true')) {
          // CRYPTODAEMON DAEMON ALREADY RUNNING
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
    write(`${homedir()}/.crypto.daemon.locked`, false).then(() => {
      log('killing Daemon');
      this.ipfs.kill();
    });
  }

  _start() {
    log('Starting Daemon');
    this.ipfs = spawn(`${__dirname}/../go-ipfs/ipfs`, ['daemon']);
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
      write(`${homedir()}/.crypto.daemon.locked`, true);
    };
  }


  _failsafe() {
    fail('cannot acquire lock');
    info('removing lock from repo');
    const unlock = spawn('go-ipfs/ipfs.exe', ['repo', 'fsck'])
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
