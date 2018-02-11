'use strict';
import { spawn } from 'child_process';
import { log, stopAndPersist, succes, info, fail } from 'crypto-logger';
import EventEmitter from 'events';
import { homedir } from 'os';
import { join } from 'path';
import { readdirectory } from 'crypto-io-fs';
import { trymore } from 'crypto-io-utils';

class CryptoDaemon extends EventEmitter {
  constructor() {
    super();
  }

  _failsafe() {
    info('removing lock from repo');
    const unlock = spawn(this.ipfsPath, ['repo', 'fsck'])
    unlock.stdout.on('data', data => {
      info('Restarting Daemon');
      this.start();
    });
  }

  async start(flags = ['']) {
    try {
      this.files = await trymore(readdirectory, [
        `${join(process.cwd(), 'ipfs')}`,
        `${join(__dirname, 'ipfs')}`,
        `${join(homedir(), '.crypto-io', 'ipfs')}`
      ]);

      for (const {filename, path} of this.files[1]) {
        if (filename.includes('ipfs.')) {
          this.ipfsPath = path;
        }
      }

      log(`Starting Daemon`);
      if (flags.length > 0) {
        info(`Flags ${[...flags]}`);
      }
      this.daemon = spawn(this.ipfsPath, ['daemon', ...flags]);

      this.daemon.stdout.on('data', data => {
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
          this.emit('ready');
        } else {
          info(data);
        }
      });

      this.daemon.stderr.on('data', data => {
        const string = data.toString();
        if (string.includes('cannot acquire lock')) {
          fail('cannot acquire lock');
          this._failsafe();
        } else {
          fail(data);
        }
      });

      this.daemon.on('close', code => {
        if (process.env.DEBUG) console.log(`child process exited with code ${code}`);
      });
    } catch (e) {
      throw e;
    }
  }

  stop() {
    log('killing Daemon');
    this.daemon.kill();
  }
}


export default (() => new CryptoDaemon())();
