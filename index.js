const fs = require('fs');
const path = require('path');
const { exit } = require('process');

const argv = process.argv[2];

switch(argv) {
  case '-h':
  case '--help':
    console.log(`
Usage: node ./index.js DIR
Example: node ./index.js ./demo/
`)
    break;
  default:
    main(argv);
}

function main(dir) {
  const packages = [];

  loop(dir, packages);

  if (!packages.length) return '> 0'
  if (packages.length === 1) packages.push('0')

  let versions = packages.map(pkg => getNodeV(pkg))
  let minV = versions.reduce((pre, next) => {
    return compareVersion(pre, next)
  })
  
  console.log('min node version:', minV);
}


function loop(dir, packages) {
  const abs_path = path.resolve(process.cwd(), dir);

  if (!fs.existsSync(abs_path)) {
    console.log(`Error: no such dir ${abs_path}`);
    exit(1);
  }

  if (fs.statSync(abs_path).isFile()) {
    console.log(`Error: ${abs_path} is not dir`);
    exit(1);
  }

  const dirs = fs.readdirSync(abs_path);
  const pkg = getPackageJson(abs_path);

  if (pkg) packages.push(pkg);

  for (let dir of dirs) {
    dir = path.resolve(abs_path, dir);
    let isFile = fs.statSync(dir).isFile();

    if (isFile) continue;

    loop(dir, packages);
  }
}

function getPackageJson(dir) {
  const package = path.resolve(dir, 'package.json');
  const bl = fs.existsSync(package);

  return bl ? package : null
}

function getNodeV(json) {
  json = require(json);

  return (json.engines && json.engines.node && getMinVersion(json.engines.node)) || '0'
}

function getMinVersion(str) {
  // >=10
  // ^10
  // ~10
  // 10
  // ^10 || ^12
  if (str.includes('||')) {
    let children = str.split('||');
    let versions = children.map(getMinVersion);

    return versions.reduce((pre, next) => {
      return(compareVersion(pre, next))
    })
  }

  const reg = /([>|<|~|^])+(=?)(.*)/;

  if (reg.test(str)) {
    return reg.exec(str)[3];
  }

  return str;
}

function compareVersion(version1, version2) {
  v1 = version1.split('.');
  v2 = version2.split('.');
  v1Len = v1.length;
  v2Len = v2.length;

  let len = Math.max(v1Len, v2Len);

  if (v1Len < len) {
    v1.push(...new Array(len - v1Len).fill(0))
  }

  if (v2Len < len) {
    v2.push(...new Array(len - v2Len).fill(0))
  }

  for (let i = 0; i < len; i++) {
    if (+v1[i] > +v2[i]) return version1;
    if (+v1[i] < +v2[i]) return version2;
  }

  return version1;
}