import { KeyFor, XOR } from '@prisma-model-types/shared'
import { ModelInterfaces, ModelName, PrismaTypes } from './types'

/**
 * Take model name (as string) or model interface exclusively.
 */
type ModelNameOrModel = XOR<ModelName, ModelInterfaces[keyof ModelInterfaces]>

/**
 * Resolve Prisma args/action/input/output/etc type for given model.
 */
export type PrismaTypeFor<
  ModelT,
  Name extends string,
  _Model = ModelT extends ModelName
    ? ModelT
    : ModelT extends ModelInterfaces[keyof ModelInterfaces]
    ? KeyFor<ModelInterfaces, ModelT>
    : never,
  _T = _Model extends string ? `${_Model}${Name}` : never
> = _T extends keyof PrismaTypes ? PrismaTypes[_T] : never

export type CreateFor<T extends ModelNameOrModel> = PrismaTypeFor<
  T,
  'CreateInput'
>
export type ArgsFor<T extends ModelNameOrModel> = PrismaTypeFor<T, 'Args'>
export type FindManyArgsFor<T extends ModelNameOrModel> = PrismaTypeFor<
  T,
  'FindManyArgs'
>
