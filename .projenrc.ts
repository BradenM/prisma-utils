import { DirEnv } from '@arroyodev-llc/projen.component.dir-env'
import { LintConfig } from '@arroyodev-llc/projen.component.linting'
import { ToolVersions } from '@arroyodev-llc/projen.component.tool-versions'
import { MonorepoProject } from '@arroyodev-llc/projen.project.nx-monorepo'
import { TypescriptProject } from '@arroyodev-llc/projen.project.typescript'

const monorepo = new MonorepoProject({
	defaultReleaseBranch: 'main',
	devDeps: [
		'@aws-prototyping-sdk/nx-monorepo',
		'@arroyodev-llc/projen.project.nx-monorepo',
		'@arroyodev-llc/projen.project.typescript',
		'@arroyodev-llc/projen.component.tool-versions',
		'@arroyodev-llc/projen.component.dir-env',
		'@arroyodev-llc/projen.component.linting',
		'@arroyodev-llc/projen.component.pnpm-workspace',
	],
	name: 'prisma-utils',
	authorName: 'Braden Mars',
	authorOrganization: false,
	authorUrl: 'https://github.com/BradenM/prisma-utils',
	authorEmail: 'bradenmars@bradenmars.me',
	pnpmVersion: '^8.6.0',
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

TypescriptProject.fromParent(monorepo, {
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
		'consola',
		'mlly',
		'type-fest',
		'fs-extra',
	],
	devDeps: ['@types/fs-extra'],
})

monorepo.synth()
