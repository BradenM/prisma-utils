import { fileURLToPath } from 'mlly'
import { defineBuildConfig } from 'unbuild'
import pkg from './package.json'

export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  rollup: {
    esbuild: {
      tsconfig: fileURLToPath(new URL('./tsconfig.build.json', import.meta.url))
    }
  },
  externals: [...Object.keys(pkg.dependencies), 'ts-toolbelt', 'type-fest']
})
