const download = require('download');
const { platform, arch } = require('os');
const { write, direxists } = require('crypto-io-utils');
const { Transform } = require('stream');
const { spawn } = require('child_process');

console.log(`installing prebuilt api dependencies`);

const system = (() => {
  this.arch = arch();
  switch (platform()) {
    case 'darwin':
    case 'linux':
    case 'freebsd':
      this.platform = platform();
      break;
    case 'win32':
      this.platform = 'windows';
      break;
    default:
      return console.warn('unsupported platform');
  }
  switch (arch()) {
    case 'arm':
      this.arch = 'arm';
      break;
    case 'x32':
    case 'x86':
      this.arch = '386';
      break;
    case 'x64':
      this.arch = 'amd64'
      break;
    default:
      return console.warn(`${arch()} is not supported for ${platform()}`);
  }
  if (this.arch === 'arm' && this.platform !== 'linux') {
    return console.warn(`${this.arch} is not supported for ${this.platform}`);
  } else if (this.arch === '386') {
    if (this.platform === 'freebsd' || 'windows') {
      return console.warn(`${this.arch} is not supported for ${this.platform}`);
    }
  }
  return {platform: this.platform, arch: this.arch}
})

async function install(version = '0.4.13', {platform, arch}) {
    if (!direxists('go-ipfs')) {
      const url = 'https://ipfs.io/ipns/dist.ipfs.io';
      const target = `go-ipfs/v${version}/go-ipfs_v${version}`;
      const ext = platform === 'windows' ? 'zip' : 'tar.gz';
      // const exec = platform === 'windows' ?
      console.log(`installing go-ipfs ${platform}-${arch}`);

      const files = await download(`${url}/${target}_${platform}-${arch}.${ext}`, {extract: true});
      if (platform === 'linux' || platform === 'freebsd') {
        spawn('chmod', ['+x', './go-ipfs/ipfs'])
      }
      const promises = []
      for (const {path, data} of files) {
        promises.push(write(path, data));
      }
      await Promise.all(promises);
    }

}
return install('0.4.13', system());
