import { LintConfig } from '@arroyodev-llc/projen.component.linting'
import { ToolVersions } from '@arroyodev-llc/projen.component.tool-versions'
import { MonorepoProject } from '@arroyodev-llc/projen.project.nx-monorepo'
import { DirEnv } from '@arroyodev-llc/projen.component.dir-env'

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
	authorUrl: 'https://github.com/prisma-utils',
	authorEmail: 'bradenmars@bradenmars.me',
	pnpmVersion: 'pnpm',
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

monorepo.synth()
