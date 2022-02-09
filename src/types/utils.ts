import { ModelName, PrismaTypes } from './types'

export type PrismaTypeFor<
  ModelT extends ModelName,
  Name extends string,
  _T = `${ModelT}${Name}`
> = _T extends keyof PrismaTypes ? PrismaTypes[_T] : never

export type CreateFor<T extends ModelName> = PrismaTypeFor<T, 'CreateInput'>
export type ArgsFor<T extends ModelName> = PrismaTypeFor<T, 'Args'>
export type FindManyArgsFor<T extends ModelName> = PrismaTypeFor<
  T,
  'FindManyArgs'
>
