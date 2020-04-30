const cwd = process.cwd()
// console.log(`Current directory: ${process.cwd()}`);
const path = require('path')
const fs = require('fs')
const { getHash } = require('./utils/get-hash')
const util = require('util')
const exec = util.promisify(require('child_process').exec);
const packageJsonFilePath = path.resolve(cwd, 'package.json')
const cacheHashFilePath = path.resolve(cwd, '.node_modules_hash.json')
const log = console.log

function updateHashCache(hashes) {
  const maxCacheCount = 100
  if (hashes.length > maxCacheCount) {
    hashes = hashes.slice(hashes.length - maxCacheCount)
  }
  return fs.writeFileSync(cacheHashFilePath, JSON.stringify(hashes, null, 4))
}

function readJson(file) {
  let result
  if (fs.existsSync(file)) {
    const str = fs.readFileSync(file, {
      encoding: 'utf-8'
    })
    try {
      result = JSON.parse(str);
    } catch (e) {

    }
  }
  return result
}
/**
 * 检测package.json依赖包是否变化
 */
function detectNodeModuleDependencies() {
  const hashes = readJson(cacheHashFilePath) || []
  const packageJSON = readJson(packageJsonFilePath) || {}
  const depsContent = JSON.stringify({
    dependencies: packageJSON.dependencies,
    devDependencies: packageJSON.devDependencies
  })
  const hash = getHash(depsContent)
  const lastHash = hashes[hashes.length - 1]

  function updateHash() {
    hashes.push(hash)
    updateHashCache(hashes)
  }
  return new Promise((resolve, reject) => {
    if (!lastHash) {
      log('你好像是第一次执行build, 打包node_modules...')
      resolve(updateHash)
    } else if (hash !== lastHash) {
      log('检测到依赖项发生变化，打包node_modules...')
      resolve(updateHash)
    } else {
      log('检测到与上次执行时相比较，依赖项无变化，不需要重新打node_modules依赖包')
      resolve()
    }
  })

}
/**
 * 打包node_modules
 * @param {*} successCb 
 */
function packNodeModules(successCb) {
  exec('tar -czf node_modules.tar.gz node_modules').then(() => {
    console.log('node_modules.tar.gz ready!')
    successCb && successCb()
    process.exit()
  }, (err) => {
    throw err
  })
}

detectNodeModuleDependencies().then((updateHash) => {
  if (updateHash) {
    packNodeModules(updateHash)
  } else {
    process.exit()
  }
}, (err) => {
  throw err
})
