import Bundler from 'parcel-bundler'
import Path from 'path'
import FS from 'fs'

export default async function(scriptName: string) {
  const templatePath = Path.join(__dirname, './__template.html')
  const indexPath = Path.join(__dirname, './__index.html')
  const contents = FS.readFileSync(templatePath)
    .toString()
    .replace('{{script}}', scriptName)

  FS.writeFileSync(indexPath, contents)

  // Bundler options
  const options = {
    watch: false, // Whether to watch the files and rebuild them on change, defaults to process.env.NODE_ENV !== 'production'
    logLevel: 0, // 5 = save everything to a file, 4 = like 3, but with timestamps and additionally log http requests to dev server, 3 = log info, warnings & errors, 2 = log warnings & errors, 1 = log errors, 0 = log nothing
    hmr: false, // Enable or disable HMR while watching
    sourceMaps: false, // Enable or disable sourcemaps, defaults to enabled (minified builds currently always create sourcemaps)
    autoInstall: false, // Enable or disable auto install of missing dependencies found during bundling
  }

  // Initializes a bundler using the entrypoint location and options provided
  const bundler = new Bundler(indexPath, options as any)
  return await (bundler as any).serve()
}
