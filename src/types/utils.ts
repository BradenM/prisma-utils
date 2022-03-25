import type { KeyFor } from '@prisma-model-types/shared'
import type { PrismaPromise } from '@prisma/client'
import pkg from '@prisma/client'
import type * as ModelTypes from './types'
import type {
  ModelInterfaces,
  ModelName,
  ParamsByModel,
  PayloadParamsByModel
} from './types'

export interface AnyModel {
  id?: string
  dateCreated?: Date | string
  dateUpdated?: Date | string
  dateInvalidated?: Date | string | null

  [key: string]: any
}

/**
 * Take model name (as string) or model interface exclusively.
 */
export type ModelNameOrModel = ModelName | AnyModel

export type IsAnyModelOrModelName<T> = [ModelNameOrModel] extends [T]
  ? 1
  : [ModelName] extends [T]
  ? 1
  : 0

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
export type NameForModel<ModelT> = IsAnyModelOrModelName<ModelT> extends 1
  ? ModelName
  : ModelT extends ModelName
  ? ModelT
  : ModelT extends ModelInterfaces[keyof ModelInterfaces]
  ? KeyFor<ModelInterfaces, ModelT>
  : never

/**
 * Resolve (interface) model from model name or model.
 */
export type ModelFromName<ModelOrName> =
  IsAnyModelOrModelName<ModelOrName> extends 1
    ? AnyModel
    : ModelOrName extends ModelName
    ? ModelInterfaces[ModelName]
    : ModelOrName extends ModelInterfaces[keyof ModelInterfaces]
    ? ModelInterfaces[NameForModel<ModelOrName>]
    : never

/**
 * Resolve Prisma args/action/input/output/etc. type for given model.
 */
export type PrismaTypeFor<
  ModelT,
  Name extends keyof ModelTypes.ModelParams,
  _Model extends string = NameForModel<ModelT>
> = IsAnyModelOrModelName<ModelT> extends 1
  ? ModelTypes.ModelParams[Name]
  : _Model extends keyof ParamsByModel
  ? ParamsByModel[_Model][Name]
  : ModelTypes.ModelParams[Name]

export type ModelParamsFor<
  ModelT,
  _Model = NameForModel<ModelT>
> = IsAnyModelOrModelName<ModelT> extends 1
  ? ModelTypes.ModelParams
  : _Model extends keyof ParamsByModel
  ? ParamsByModel[_Model]
  : ModelTypes.ModelParams

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
  'FindFirstArgs'
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

/**
 * Resolve Prisma args/action/input/output/etc. type for given model.
 */
export type PayloadFor<
  ModelT extends ModelNameOrModel,
  T extends ArgsFor<ModelT> | any = undefined,
  _Model extends string = NameForModel<ModelT>
> = IsAnyModelOrModelName<ModelT> extends 1
  ? ModelTypes.ModelPayloadParams['Payload']
  : _Model extends keyof PayloadParamsByModel<any>
  ? PayloadParamsByModel<T>[_Model]['Payload']
  : ModelTypes.ModelPayloadParams['Payload']

export type { PrismaPromise }
