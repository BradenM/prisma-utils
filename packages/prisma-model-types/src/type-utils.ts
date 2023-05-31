/**
 * Remove never props.
 */
export type RemoveNeverProps<T> = {
	[K in Exclude<
		keyof T,
		{
			[P in keyof T]: T[P] extends Function ? P : never
		}[keyof T]
	>]: T[K]
}

/**
 * Test if object includes given property.
 */
export type IncludeProp<T extends object, E> = RemoveNeverProps<{
	[K in keyof T]: T[K] extends E ? T[K] : never
}>

/**
 * Obtain key for given value from an object.
 */
export type KeyFor<
	ObjectT extends object,
	ValueT extends ObjectT[keyof ObjectT]
> = keyof IncludeProp<ObjectT, ValueT>

/**
 * Generic model match.
 */
export interface AnyModel {
	id?: string

	[key: string]: any
}

/**
 * Generic payload args match.
 */
export interface AnyArgs {
	select?: any
	include?: any
}

/**
 * Conditional args match.
 */
export type MaybeAnyArgs = boolean | AnyArgs | null | undefined
