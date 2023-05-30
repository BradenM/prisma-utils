// @ts-expect-error ignore
import { builder } from '../../scripts/compile/build-config'

builder([
  {
    bundle: true,
    tsconfig: './tsconfig.build.json',
    entryPoints: ['./src/index.ts'],
    noExternal: ['@prisma/client']
  }
])
