import { KeyFor, XOR } from '@prisma-model-types/shared'
import type { PrismaPromise } from '@prisma/client'
import pkg from '@prisma/client'
import { Simplify } from 'type-fest'
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
 * Generic Prisma model delegate type.
 */
export interface Delegate<T = any> {
  findMany(...args: any[]): Promise<T>

  findFirst(...args: any[]): Promise<T>

  findUnique(...args: any[]): Promise<T>

  create(...args: any[]): Promise<T>

  update(...args: any[]): Promise<T>

  upsert(...args: any[]): Promise<T>

  delete(...args: any[]): Promise<T>
}

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
 * Create a stricter subset of Prisma types based on given parameters.
 */
export type _PrismaSubset<
  Name extends string,
  Model extends string = string
> = {
  [K in Extract<keyof PrismaTypes, `${Model}${Name}`>]: PrismaTypes[K]
}

/**
 * Resolve Prisma args/action/input/output/etc. type for given model.
 */
export type PrismaTypeFor<
  ModelT,
  Name extends string,
  _Model extends string = NameForModel<ModelT>,
  _T = _Model extends string ? `${_Model}${Name}` : never
> = Simplify<
  _T extends keyof _PrismaSubset<Name, _Model>
    ? _PrismaSubset<Name, _Model>[_T]
    : never
>

export type CreateFor<T extends ModelNameOrModel> = PrismaTypeFor<
  T,
  'CreateInput'
>

export type UpdateFor<T extends ModelNameOrModel> = PrismaTypeFor<
  T,
  'UpdateInput'
>

export type ArgsFor<T extends ModelNameOrModel> = PrismaTypeFor<T, 'Args'>
export type CreateArgsFor<T extends ModelNameOrModel> = PrismaTypeFor<
  T,
  'CreateArgs'
>
export type UpdateArgsFor<T extends ModelNameOrModel> = PrismaTypeFor<
  T,
  'UpdateArgs'
>

export type UpsertArgsFor<T extends ModelNameOrModel> = PrismaTypeFor<
  T,
  'UpsertArgs'
>

export type FindManyArgsFor<T extends ModelNameOrModel> = PrismaTypeFor<
  T,
  'FindManyArgs'
>

export type FindFirstArgsFor<T extends ModelNameOrModel> = PrismaTypeFor<
  T,
  'FindFindArgs'
>

export type FindUniqueArgsFor<T extends ModelNameOrModel> = PrismaTypeFor<
  T,
  'FindUniqueArgs'
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

export type DelegateFor<T extends ModelNameOrModel> = PrismaTypeFor<
  T,
  'Delegate'
>

export const validatorFor = <
  ModelT extends ModelNameOrModel,
  _ModelArgs = ArgsFor<ModelT>
>() => pkg.Prisma.validator<_ModelArgs>()

export type PayloadFor<
  T extends ModelNameOrModel,
  S = ArgsFor<NameForModel<T>>,
  _T = NameForModel<T>
> = _T extends keyof PrismaPayloadTypes<S> ? PrismaPayloadTypes<S>[_T] : never

export type { PrismaPromise }
