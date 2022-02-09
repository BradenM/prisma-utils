import path from 'node:path'
import {
  DMMF,
  GeneratorConfig,
  GeneratorManifest,
  GeneratorOptions,
  generatorHandler
} from '@prisma/generator-helper'
import sdk from '@prisma/sdk'
import fse from 'fs-extra'

/**
 * Basic Prisma generator that outputs helper types.
 */

const { logger } = sdk

/**
 * Generates types from DMMF data.
 *
 * This is a workaround for the apparent inability
 * to use template string index accessors on typescript
 * namespaces.
 *
 * As of TS 4.6, something like (shortened for brevity):
 * type CreateFor<T> = T extends keyof typeof Prisma ? typeof Prisma[`${T}`] : never
 * const myVal: CreateFor<'SomeInterface'> = {}
 *
 * Will ONLY compile successfully if (and only if) the CreateFor type is defined
 * in the same scope. (i.e, the result will always be never given an import of CreateFor or something)
 *
 * Despite this, the TS Lang Server (via webstorm at least) correctly infers the type and provides
 * autocompletion. (again, this being with the code failing to compile via tsc).
 *
 * This makes me think it may be a possible bug in TS itself...
 *
 * @param models - DMMF models.
 * @param enums - DMMF enums.
 */
const createInterface = (
  models: DMMF.Model[],
  enums: DMMF.DatamodelEnum[]
): string => {
  const modelNames = models
    .map(({ name }) => name)
    .sort((a, b) => b.length - a.length)
  const interfaceNames = ['CreateInput', 'FindManyArgs', 'Args']

  const lines = new Set()
  modelNames.forEach((n) => {
    interfaceNames.forEach((i) => lines.add(`  ${n}${i}: Prisma.${n}${i}`))
  })

  const enumNames = enums.map(({ name }) => name)
  const enumLines = enumNames.map((n) => `export const ${n}s = pkg.${n}`)

  const typeImports = ['Prisma', ...enumNames, ...modelNames]

  const interfaceTmpl = `
import type { ${typeImports.join(', ')} } from '@prisma/client'
import pkg from '@prisma/client'

export const ModelNames = pkg.Prisma.ModelName
export type ModelName = Prisma.ModelName

// Enums
${enumLines.join('\n')}

export { ${typeImports.join(', ')} }

// Models
export interface PrismaTypes {
${Array.from(lines).join('\n')}
}
`
  logger.info(interfaceTmpl)
  return interfaceTmpl
}

// Setup prisma handler.
generatorHandler({
  onManifest(config: GeneratorConfig): GeneratorManifest {
    logger.info('Types Gen Loaded!')
    logger.info(config.name)
    return {
      defaultOutput: '../src/types',
      prettyName: 'types-gen',
      version: '1.0.0'
    }
  },
  async onGenerate(options: GeneratorOptions): Promise<any> {
    const outPath = path.join(options.generator.output!.value, 'types.ts')
    const res = createInterface(
      options.dmmf.datamodel.models,
      options.dmmf.datamodel.enums
    )
    await fse.outputFile(outPath, res)
  }
})
