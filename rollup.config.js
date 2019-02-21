import autoExternal from 'rollup-plugin-auto-external'
import path from 'path'
import typescript from 'rollup-plugin-typescript2'
import css from 'rollup-plugin-css-only'

export default async a => {
  return {
    input: 'index.ts',
    output: [
      { format: 'cjs', file: path.resolve(__dirname, 'lib', `index.js`) },
    ],
    plugins: [
      autoExternal({
        builtins: true,
        dependencies: true,
        packagePath: path.resolve(__dirname, 'package.json'),
        peerDependencies: true,
      }),
      css({ output: path.resolve(__dirname, 'lib', `bundle.css`) }),
      typescript(),
    ],
  }
}
