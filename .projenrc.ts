import { DirEnv } from '@arroyodev-llc/projen.component.dir-env'
import { LintConfig } from '@arroyodev-llc/projen.component.linting'
import { ReleasePlease } from '@arroyodev-llc/projen.component.release-please'
import { ToolVersions } from '@arroyodev-llc/projen.component.tool-versions'
import { UnBuild } from '@arroyodev-llc/projen.component.unbuild'
import { MonorepoProject } from '@arroyodev-llc/projen.project.nx-monorepo'
import { TypescriptProject } from '@arroyodev-llc/projen.project.typescript'
import { GithubCredentials } from 'projen/lib/github'

const ghCreds = GithubCredentials.fromPersonalAccessToken({
	secret: 'GH_PAT',
})

const monorepo = new MonorepoProject({
	defaultReleaseBranch: 'main',
	devDeps: [
		'@aws-prototyping-sdk/nx-monorepo',
		'@arroyodev-llc/projen.project.nx-monorepo',
		'@arroyodev-llc/projen.project.typescript',
		'@arroyodev-llc/projen.component.tool-versions',
		'@arroyodev-llc/projen.component.dir-env',
		'@arroyodev-llc/projen.component.linting',
		'@arroyodev-llc/projen.component.unbuild',
		'@arroyodev-llc/projen.component.release-please',
	],
	name: 'prisma-utils',
	authorName: 'Braden Mars',
	authorOrganization: false,
	authorUrl: 'https://github.com/BradenM/prisma-utils',
	authorEmail: 'bradenmars@bradenmars.me',
	pnpmVersion: '^8.6.0',
	projenCredentials: ghCreds,
	githubOptions: {
		projenCredentials: ghCreds,
	},
})
new LintConfig(monorepo)
new ToolVersions(monorepo, {
	tools: {
		direnv: ['2.32.3'],
		nodejs: ['18.15.0'],
		pnpm: ['8.6.0'],
	},
})
new DirEnv(monorepo).buildDefaultEnvRc({
	localEnvRc: '.envrc.local',
	minDirEnvVersion: '2.32.3',
})
const releasePlease = new ReleasePlease(monorepo).addPlugin({
	type: 'node-workspace',
})
monorepo.applyGithubJobNxEnv(
	releasePlease.releaseWorkflow.workflow,
	'release-please'
)

const modelTypes = TypescriptProject.fromParent(monorepo, {
	name: 'prisma-model-types',
	authorName: 'Braden Mars',
	authorOrganization: false,
	authorUrl: 'https://github.com/BradenM/prisma-utils',
	authorEmail: 'bradenmars@bradenmars.me',
	peerDependencyOptions: { pinnedDevDependency: true },
	peerDeps: ['prisma'],
	deps: [
		'@prisma/client',
		'@prisma/generator-helper',
		'@prisma/internals',
		'@prisma/migrate',
		'@prisma/sdk',
		'type-fest',
		'fs-extra',
		'pathe',
		'ts-morph',
		'@arroyodev-llc/utils.ts-ast',
	],
	devDeps: ['@types/fs-extra'],
	unbuild: false,
	tsconfig: {
		compilerOptions: {
			rootDir: '.',
		},
	},
})
modelTypes.package.addField('name', 'prisma-model-types')
modelTypes.package.addBin({
	'prisma-model-types': 'dist/bin.mjs',
})
modelTypes.tasks.tryFind('post-compile')!.exec('unbuild')
new UnBuild(modelTypes, { cjs: true }).addConfig({
	name: 'prisma-model-types',
	clean: true,
	declaration: true,
})

monorepo.synth()
