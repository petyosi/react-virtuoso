const Parcel = require('@parcel/core')
const Path = require('path')
const FS = require('fs')

const scriptFilePath = process.argv[process.argv.length - 1]
const scriptName = Path.basename(scriptFilePath, '.tsx')

const templatePath = Path.join(__dirname, './__template.html')
const indexPath = Path.join(__dirname, './__index.html')
const contents = FS.readFileSync(templatePath)
  .toString()
  .replace('{{script}}', scriptName)

FS.writeFileSync(indexPath, contents)

// Bundler options
const options = {
  watch: true, // Whether to watch the files and rebuild them on change, defaults to process.env.NODE_ENV !== 'production'
  logLevel: 3, // 5 = save everything to a file, 4 = like 3, but with timestamps and additionally log http requests to dev server, 3 = log info, warnings & errors, 2 = log warnings & errors, 1 = log errors, 0 = log nothing
  hmr: true, // Enable or disable HMR while watching
  sourceMaps: true, // Enable or disable sourcemaps, defaults to enabled (minified builds currently always create sourcemaps)
  autoInstall: false, // Enable or disable auto install of missing dependencies found during bundling
}

const bundler = new Parcel(indexPath, options)

;(async function() {
  return await bundler.serve(1234)
})()
