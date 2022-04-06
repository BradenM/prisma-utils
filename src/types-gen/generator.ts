import path from 'node:path'
import type {
  DMMF,
  GeneratorConfig,
  GeneratorManifest,
  GeneratorOptions
} from '@prisma/generator-helper'
import { generatorHandler } from '@prisma/generator-helper'
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

  // Per-model parameters interface.
  const modelParams = modelNames.map(
    (mname) => `export interface ${mname}Params {
    model: "${mname}"
${interfaceNames
  .map((iname) => `  ${iname}: Prisma.${mname}${iname}`)
  .join('\n')}
    Delegate: Prisma.${mname}Delegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>
}`
  )

  // Per model payload interface.
  const modelPayloadParams = modelNames.map(
    (mname) => `export interface ${mname}PayloadParams<T> {
    model: "${mname}"
    Payload: Prisma.${mname}GetPayload<T>
}`
  )

  // Model map.
  const modelMap = modelNames.map((n) => ` ${n}: ${n}`)

  // Model enum util.
  const modelEnum = modelNames.map((n) => `  ${n} = '${n}'`)

  // Schema `enum` objects.
  const enumNames = enums.map(({ name }) => name)
  const enumLines = enumNames.map((n) => `export const ${n}s = pkg.${n}`)

  const typeImports = ['Prisma', 'PrismaClient', ...enumNames, ...modelNames]

  // language=typescript
  const interfaceTmpl = `
import type { ${typeImports.join(', ')} } from '@prisma/client'
import pkg from '@prisma/client'

export const ModelNames = pkg.Prisma.ModelName
export type ModelName = Prisma.ModelName

export const QueryModes = pkg.Prisma.QueryMode
export type QueryMode = Prisma.QueryMode

// Base interface matching any model delegate.
export type ModelDelegate = { [key in Prisma.PrismaAction]?: (...args: any[]) => any }


// Base interface for model params.
export interface ModelParams {
    model: ModelName
${interfaceNames.map((n) => `  ${n}: any`)}  
    Delegate: ModelDelegate
}


${modelParams.join('\n\n')}


// All model params keyed by model.
export interface ParamsByModel {
${modelNames.map((mname) => `  ${mname}: ${mname}Params`)}
}


// Base interface for model payload params.
export interface ModelPayloadParams {
  model: ModelName
  Payload: any
}


${modelPayloadParams.join('\n\n')}


// All Payload params types keyed by model. 
export interface PayloadParamsByModel<T> {
${modelNames.map((mname) => `  ${mname}: ${mname}PayloadParams<T>`)}
}

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
