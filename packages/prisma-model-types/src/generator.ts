import { fileURLToPath } from 'url'
import {
	type DMMF,
	type GeneratorConfig,
	generatorHandler,
	type GeneratorManifest,
	type GeneratorOptions,
} from '@prisma/generator-helper'
import sdk from '@prisma/sdk'
import fse from 'fs-extra'
import path from 'pathe'
import {
	type InterfaceDeclarationStructure,
	type OptionalKind,
	Project,
	type PropertySignatureStructure,
	type SourceFile,
} from 'ts-morph'

/**
 * Basic Prisma generator that outputs helper types.
 */

const { logger } = sdk

interface BuildOptions {
	filePath: string
	models: DMMF.Model[]
	enums: DMMF.DatamodelEnum[]
}

const INTERFACE_NAMES = [
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
	'DeleteArgs',
]

// language=typescript
const HELPERS = `

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
	Name extends keyof ModelParams,
	_Model extends string = NameForModel<ModelT>
> = IsAnyModelOrModelName<ModelT> extends 1
	? ModelParams[Name]
	: _Model extends keyof ParamsByModel
		? ParamsByModel[_Model][Name]
		: ModelParams[Name]

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
	T extends ArgsFor<ModelT> | undefined | null | boolean = undefined,
	// _Model = NameForModel<ModelT>
	_Model extends string = NameForModel<ModelT>
	// _Model extends string = NameForModel<ModelT> extends string ? NameForModel<ModelT> : NameForModel<ModelT>
> = IsAnyModelOrModelName<ModelT> extends 1
	? ModelTypes.ModelPayloadParams['Payload']
	: _Model extends keyof PayloadParamsByModel<any>
		? PayloadParamsByModel<T>[_Model]['Payload']
		: ModelTypes.ModelPayloadParams['Payload']
	`

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
 * @param filePath Write target path.
 * @param models DMMF models.
 * @param enums DMMF enums.
 */
const build = ({ filePath, models, enums }: BuildOptions): SourceFile => {
	const project = new Project({
		skipAddingFilesFromTsConfig: true,
	})
	const module = project.createSourceFile(filePath, ``, { overwrite: true })

	// Workaround interface for namespace issue.
	const modelNames = models
		.map(({ name }) => name)
		.sort((a, b) => b.length - a.length)
	const enumNames = enums.map(({ name }) => name)

	const typeImports = ['Prisma', 'PrismaClient', ...enumNames, ...modelNames]

	// Imports
	module.addImportDeclarations([
		{
			namedImports: ['KeyFor', 'AnyModel', 'AnyArgs', 'MaybeAnyArgs'],
			moduleSpecifier: 'prisma-model-types',
			isTypeOnly: true,
		},
		{
			namedImports: typeImports,
			moduleSpecifier: '@prisma/client',
			isTypeOnly: true,
		},
	])

	// Model name
	module.addVariableStatements([
		{
			declarations: [
				{
					name: 'ModelNames',
					initializer: `Prisma.ModelNames`,
				},
			],
			isExported: true,
		},
		{
			isExported: true,
			declarations: [
				{
					name: 'ModelName',
					type: 'Prisma.ModelName',
				},
			],
		},
	])

	// ModelDelegate
	module.addTypeAlias({
		name: 'ModelDelegate',
		leadingTrivia: '// Base interface matching any model delegate.',
		isExported: true,
		type: (writer) =>
			writer.block(() =>
				writer.write(`[key in Prisma.PrismaAction]?: (...args: any[]) => any`)
			),
	})

	// Model Params base.
	module.addInterface({
		name: 'ModelParams',
		isExported: true,
		properties: [
			{
				name: 'model',
				type: 'ModelName',
			},
			...INTERFACE_NAMES.map((propName) => ({
				name: propName,
				type: 'any',
			})),
			{
				name: 'Delegate',
				type: 'ModelDelegate',
			},
		],
	})

	// Model parameters.
	const paramsInterfaces = modelNames.map<
		OptionalKind<InterfaceDeclarationStructure>
	>((name) => {
		const paramsProps = INTERFACE_NAMES.map<
			OptionalKind<PropertySignatureStructure>
		>((propName) => ({
			name: propName,
			type: `Prisma.${name}${propName}`,
		}))

		return {
			name: `${name}Params`,
			leadingTrivia: `// ${name} model parameters.`,
			isExported: true,
			properties: [
				{
					name: 'model',
					type: `"${name}"`,
				},
				...paramsProps,
				{
					name: 'Delegate',
					type: `Prisma.${name}Delegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>`,
				},
			],
		}
	})

	module.addInterfaces(paramsInterfaces)
	module.addInterface({
		name: 'ParamsByModel',
		isExported: true,
		leadingTrivia: '// All model params keyed by model.',
		properties: modelNames.map((name) => ({
			name,
			type: `${name}Params`,
		})),
	})

	// payload
	const payloadInterfaces = modelNames.map<
		OptionalKind<InterfaceDeclarationStructure>
	>((name) => ({
		name: `${name}PayloadParams`,
		leadingTrivia: `// ${name} payload parameters.`,
		isExported: true,
		typeParameters: [
			{
				name: 'T',
				constraint: 'MaybeAnyArgs',
			},
		],
		properties: [
			{
				name: 'model',
				type: `"${name}"`,
			},
			{
				name: 'Payload',
				type: `${name}PayloadParams<T>`,
			},
		],
	}))
	module.addInterfaces(payloadInterfaces)

	// Model enum.
	module.addEnum({
		name: 'Model',
		leadingTrivia: [
			'/** Helper enum of Model names.',
			' * Just allows for:',
			' * SomeType<Model.User> as an alternative too:',
			` * SomeType<'User'> or SomeType<typeof Models.User>`,
			' */\n',
		],
		isExported: true,
		members: modelNames.map((name) => ({
			name,
			type: `"${name}"`,
		})),
	})

	// Model interfaces.
	module.addInterface({
		name: 'ModelInterfaces',
		isExported: true,
		leadingTrivia: [
			'/** Model Map',
			' * Useful for mapping model interfaces <-> model names (among other things.)',
			' * @see https://stackoverflow.com/a/53431302/2666223',
			' */\n',
		],
		properties: modelNames.map((name) => ({ name, type: name })),
	})

	// Helpers
	module.addStatements([(writer) => writer.write(HELPERS)])

	module.addExportDeclaration({
		namedExports: typeImports,
	})

	return module
}

export const generate = () => {
	const pkgPath = fileURLToPath(new URL('..', import.meta.url))
	// Setup prisma handler.
	generatorHandler({
		onManifest(config: GeneratorConfig): GeneratorManifest {
			logger.info('Prisma Model Types Generator Loaded!')
			logger.info(config.name)
			return {
				defaultOutput: pkgPath ?? './',
				prettyName: 'prisma-model-types-generator',
				version: '1.0.0',
				requiresGenerators: ['prisma-client-js'],
			}
		},
		async onGenerate(options: GeneratorOptions): Promise<any> {
			const outPath = path.join(
				options.generator.output!.value! ?? pkgPath,
				'prisma-model-types.d.ts'
			)
			logger.info(`Writing to ${outPath} (pkgPath: ${pkgPath})`)
			const source = build({
				filePath: outPath,
				models: options.dmmf.datamodel.models,
				enums: options.dmmf.datamodel.enums,
			})
			await fse.outputFile(outPath, source.getFullText())
		},
	})
}
