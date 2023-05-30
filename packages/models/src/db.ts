import path from 'node:path'
import { URL, fileURLToPath } from 'node:url'
// import { DbPush } from '@prisma/migrate'
// import consola from 'consola'
import { execa } from 'execa'

export const getSchemaPath = () =>
  path.resolve(
    fileURLToPath(new URL('../prisma/schema.prisma', import.meta.url))
  )

// export const doDbPush = async (schemaPath?: string) => {
//   const schema = schemaPath ?? getSchemaPath()
//   consola.log('Pushing database...', { schema })
//   const result = await DbPush.new().parse([
//     `--schema=${schema}`,
//     '--skip-generate'
//   ])
//   consola.log(result)
//   return result
// }

export const execDbPush = async (
  opts: {
    schemaPath?: string
    dbUri?: string
  } = {}
) => {
  const { schemaPath = getSchemaPath(), dbUri } = opts
  const schema = schemaPath ?? getSchemaPath()
  const pkgDir = path.resolve(fileURLToPath(new URL('../', import.meta.url)))
  const proc = execa(
    'prisma',
    ['db', 'push', `--schema=${schema}`, '--skip-generate'],
    {
      all: true,
      cwd: pkgDir,
      localDir: pkgDir,
      preferLocal: true,
      windowsHide: false,
      ...(dbUri
        ? {
            env: {
              DATABASE_URL: dbUri
            }
          }
        : {})
    }
  )
  proc.all!.pipe(process.stdout)
  await proc
}
