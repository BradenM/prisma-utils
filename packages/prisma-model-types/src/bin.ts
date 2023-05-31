#!/usr/bin/env node
import { generate } from './generator'

// eslint-disable-next-line @typescript-eslint/require-await
async function main() {
	generate()
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
