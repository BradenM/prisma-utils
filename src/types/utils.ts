import { KeyFor, XOR } from '@prisma-model-types/shared'
import type { PrismaPromise } from '@prisma/client'
import {
  ModelInterfaces,
  ModelName,
  PrismaPayloadTypes,
  PrismaTypes
} from './types'

/**
 * Take model name (as string) or model interface exclusively.
 */
export type ModelNameOrModel = XOR<
  ModelName,
  ModelInterfaces[keyof ModelInterfaces]
>

/**
 * Resolve (string) name from model name or model interface.
 */
export type NameForModel<ModelT> = ModelT extends ModelName
  ? ModelT
  : ModelT extends ModelInterfaces[keyof ModelInterfaces]
  ? KeyFor<ModelInterfaces, ModelT>
  : never

/**
 * Resolve (interface) model from model name or model.
 */
export type ModelFromName<ModelOrName> = ModelOrName extends ModelName
  ? ModelInterfaces[ModelName]
  : ModelOrName extends ModelInterfaces[keyof ModelInterfaces]
  ? ModelOrName
  : never

/**
 * Resolve Prisma args/action/input/output/etc. type for given model.
 */
export type PrismaTypeFor<
  ModelT,
  Name extends string,
  _Model = NameForModel<ModelT>,
  _T = _Model extends string ? `${_Model}${Name}` : never
> = _T extends keyof PrismaTypes ? PrismaTypes[_T] : never

export type CreateFor<T extends ModelNameOrModel> = PrismaTypeFor<
  T,
  'CreateInput'
>

export type UpdateFor<T extends ModelNameOrModel> = PrismaTypeFor<
  T,
  'UpdateInput'
>

export type ArgsFor<T extends ModelNameOrModel> = PrismaTypeFor<T, 'Args'>

export type FindManyArgsFor<T extends ModelNameOrModel> = PrismaTypeFor<
  T,
  'FindManyArgs'
>

export type SelectFor<T extends ModelNameOrModel> = PrismaTypeFor<T, 'Select'>

export type IncludeFor<T extends ModelNameOrModel> = PrismaTypeFor<T, 'Include'>

export type WhereFor<T extends ModelNameOrModel> = PrismaTypeFor<
  T,
  'WhereInput'
>

export type WhereUniqueFor<T extends ModelNameOrModel> = PrismaTypeFor<
  T,
  'WhereUniqueInput'
>

export type PayloadFor<
  T extends ModelNameOrModel,
  S extends ArgsFor<NameForModel<T>> = ArgsFor<NameForModel<T>>,
  _T = NameForModel<T>
> = _T extends keyof PrismaPayloadTypes<S> ? PrismaPayloadTypes<S>[_T] : never

export type { PrismaPromise }
