// Usage: yarn run sync-strings ~/projects/projects/brave/ethereum-remote-client ~/projects/MetaMask/metamask-extension
// Will write available strings from brave-dir to metmask-dir without adding/removing existing string identifiers in metmask-dir.

const program = require('commander')
const syncStrings = require('./sync-strings')

program
  .command('sync-strings')
  .arguments('[sourceDir] [destDir]')
  .action(syncStrings)

program
  .parse(process.argv)
