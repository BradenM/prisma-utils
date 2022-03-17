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
  // Workaround interface for namespace issue.
  const modelNames = models
    .map(({ name }) => name)
    .sort((a, b) => b.length - a.length)
  const interfaceNames = [
    'CreateInput',
    'UpdateInput',
    'WhereInput',
    'WhereUniqueInput',
    'Select',
    'Include',
    'Args',
    'CreateArgs',
    'UpdateArgs',
    'UpsertArgs',
    'FindUniqueArgs',
    'FindFirstArgs',
    'FindManyArgs',
    'DeleteArgs'
  ]
  const lines = new Set()

  modelNames.forEach((n) => {
    interfaceNames.forEach((i) => lines.add(`  ${n}${i}: Prisma.${n}${i}`))
  })

  modelNames.forEach((n) =>
    lines.add(`  ${n}Delegate: Prisma.${n}Delegate<Prisma.RejectOnNotFound>`)
  )

  // Delegate Types.
  const delegateTypes = modelNames.map(
    (n) => `  ${n}Delegate: Prisma.${n}Delegate<Prisma.RejectOnNotFound>`
  )

  // Model str names.
  const modelStrNames = modelNames.map((n) => `"${n}"`)

  // Payload Types.
  const payloadTypes = modelNames.map((n) => `  ${n}: Prisma.${n}GetPayload<S>`)

  // Model map.
  const modelMap = modelNames.map((n) => ` ${n}: ${n}`)

  // Model enum util.
  const modelEnum = modelNames.map((n) => `  ${n} = '${n}'`)

  // Schema `enum` objects.
  const enumNames = enums.map(({ name }) => name)
  const enumLines = enumNames.map((n) => `export const ${n}s = pkg.${n}`)

  const typeImports = ['Prisma', 'PrismaClient', ...enumNames, ...modelNames]

  const interfaceTmpl = `
import type { ${typeImports.join(', ')} } from '@prisma/client'
import pkg from '@prisma/client'

export const ModelNames = pkg.Prisma.ModelName
export type ModelName = Prisma.ModelName

export type ModelNamesTuple = [${modelStrNames.join(', ')}]

// Helper enum of Model names. 
// Just allows for:
// SomeType<Model.User> instead of:
// SomeType<'User'> or SomeType<typeof Models.User>
export enum Model {
${modelEnum.join(',\n')}
}

// Enums
${enumLines.join('\n')}


/**
 * Model Map.
 * Useful for mapping model interfaces <-> model name (among other things).
 * @see - https://stackoverflow.com/a/53431302/2666223
 */
export interface ModelInterfaces {
${modelMap.join('\n')}
}


export { ${typeImports.join(', ')} }

// Models
export interface PrismaTypes {
${Array.from(lines).join('\n')}
}

// Payload Types
export interface PrismaPayloadTypes<S> {
${payloadTypes.join('\n')}
}

// Delegate Tuple
export type Delegates = [
${delegateTypes.join(',\n')}
]

`
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
