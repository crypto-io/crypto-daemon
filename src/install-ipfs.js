const download = require('download');
const { platform, arch, homedir } = require('os');
const { write, direxists } = require('crypto-io-fs');
const { Transform } = require('stream');
const { spawnSync } = require('child_process');
const { join } = require('path');
const { unlinkSync, rmdirSync, readdir } = require('fs');
const { log, stopAndPersist, succes, info, fail } = require('crypto-logger');

const home = join(homedir(), '.crypto-io');
const ipfsPath = join(home, 'ipfs/ipfs');
const ipfsdir = join(homedir(), '.ipfs');

log(`installing prebuilt api dependencies`);

export const hasFile = (path, name) => new Promise((resolve, reject) => {
  readdir(path, (error, files) => {
    if (error) resolve(false);
    else
      for (const file of files) {
        if (file.includes('ipfs')) {
          return resolve(true);
        }
      }
      resolve(false);
  })
});

export const system = (() => {
  let architecture = arch();
  let os;
  switch (platform()) {
    case 'darwin':
    case 'linux':
    case 'freebsd':
      os = platform();
      break;
    case 'win32':
      os = 'windows';
      break;
    default:
      return console.warn('unsupported platform');
  }
  switch (arch()) {
    case 'arm':
      architecture = 'arm';
      break;
    case 'x32':
    case 'x86':
      architecture = '386';
      break;
    case 'x64':
      architecture = 'amd64'
      break;
    default:
      return console.warn(`${architecture()} is not supported for ${platform()}`);
  }
  if (architecture === 'arm' && os !== 'linux') {
    return console.warn(`${architecture} is not supported for ${os}`);
  } else if (architecture === '386') {
    if (platform === 'freebsd' || 'windows') {
      return console.warn(`${architecture} is not supported for ${os}`);
    }
  }
  return {platform: os, arch: architecture}
})

async function install(version = '0.4.13', {platform, arch}) {
    const hasipfs = await hasFile(join(home, 'ipfs'), 'ipfs')
    if (!hasipfs) {
      const url = 'https://ipfs.io/ipns/dist.ipfs.io';
      const target = `go-ipfs/v${version}/go-ipfs_v${version}`;
      const ext = platform === 'windows' ? 'zip' : 'tar.gz';
      // const exec = platform === 'windows' ?
      log(`installing go-ipfs ${platform}-${arch}`);

      const files = await download(`${url}/${target}_${platform}-${arch}.${ext}`,
        home,
        {extract: true}
      );
      const promises = []
      info(`Moving some files`);
      let i = 0;
      info(`Processing [${i + 1}/${files.length}]`);
      for (const {path, data} of files) {
        const dest = join(home, path.replace('go-', ''));
        await write(dest, data);
        await unlinkSync(join(home, path))
        i++
        if (i === files.length) {
          succes(`Moving some files`);
          if (platform === 'linux' || platform === 'freebsd') {
            log(`making ipfs executable`);
            try {
              spawnSync('chmod', ['+x', join(home, 'ipfs', 'ipfs')]);
              succes('making ipfs executable');
            } catch (error) {
              fail(error)
            }
          }
          await rmdirSync(join(home, 'go-ipfs'));

          // if (!direxists(ipfsdir)) {
          spawnSync(ipfsPath, ['init']);
          // }
          succes(`installing go-ipfs ${platform}-${arch}`)
        } else {
          info(`Processing [${i + 1}/${files.length}]`);
        }
      }
    }
    succes('installing prebuilt dependencies');
    return;
}
export default install('0.4.13', system());
