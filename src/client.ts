import type { PrismaClient } from '@prisma/client'
import pkg from '@prisma/client'

/**
 * Shared Prisma Client.
 * @see - https://github.com/prisma/prisma/issues/5030
 * @see - https://github.com/prisma/prisma/issues/10404#issuecomment-984535897
 *
 */

declare global {
  // eslint-disable-next-line eslint-comments/no-unlimited-disable
  // eslint-disable-next-line
  var _prisma: PrismaClient
}

let prisma
if (['test', 'development'].includes(process.env.NODE_ENV ?? 'development')) {
  if (!global._prisma) {
    global._prisma = new pkg.PrismaClient()
  }
  prisma = global._prisma
} else {
  const { PrismaClient: _PrismaClient } = pkg
  prisma = new _PrismaClient()
}

export default prisma as PrismaClient // shim

export { PrismaClient }
