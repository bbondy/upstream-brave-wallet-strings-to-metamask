const path = require('path')
const fs = require('fs')

const assertDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    console.error('Source dir does not exist')
    process.exit(1)
  }
}

const getLangStringsMap = (dir, filterLangsFn = filterLangs) => {
  const langStringsMap = {}
  fs.readdirSync(dir)
    .filter(filterLangsFn)
    .forEach((lang) => {
      const langPath = path.join(dir, lang, 'messages.json')
      const langMap = JSON.parse(fs.readFileSync(langPath, 'utf8'))
      langStringsMap[lang] = {}
      Object.keys(langMap).forEach((key) => {
        langStringsMap[lang][key] = langMap[key].message
      })
    })
  return langStringsMap
}

const filterLangs = (lang) =>
  !['index.json', 'en'].includes(lang)

const syncLangStrings = (destDir, sourceLangStringsMap, destLangStringsMap) => {
  fs.readdirSync(destDir)
    .filter(filterLangs)
    .forEach((lang) => {
      const langPath = path.join(destDir, lang, 'messages.json')
      // Create a lang map which is the entire dest dir content
      // this might get overwritten if the dest file already exists
      let langMap = Object.keys(sourceLangStringsMap[lang]).reduce((acc, cur) => {
        acc[cur] = {
          message: sourceLangStringsMap[lang][cur]
        }
        return acc
      }, {})
      let newFile = true
      if (fs.existsSync(langPath)) {
        langMap = JSON.parse(fs.readFileSync(langPath, 'utf8'))
        newFile = false
      }
      Object.keys(langMap).forEach((key) => {
        if (sourceLangStringsMap[lang][key] || newFile) {
          langMap[key].message =
            formattingFixer(brandingFixer(sourceLangStringsMap[lang][key]))
        }
        // Make sure that the source language contains the string to be translated
        // This avoids keeping translations for removed strings
        if (!destLangStringsMap.en[key]) {
          delete langMap[key]
        }
      })
      // MetaMask prefers not to have this.
      /*
      // Make sure we have English strings for any string that's missing
      Object.keys(destLangStringsMap.en).forEach((key) => {
        if (!langMap[key]) {
          langMap[key] = { message: destLangStringsMap.en[key] }
        }
      })
      */
      const data = JSON.stringify(langMap, null, 2)
      console.log('writing lang path is: ', langPath)
      fs.writeFileSync(langPath, data + '\n', 'utf8')
    })
}

const brandingFixer = (sourceString) =>
  (sourceString || '')
    .replace(/Brave Software/g, 'Google')
    .replace(/Brave/g, 'Chrome')

const formattingFixer = (sourceString) =>
  (sourceString || '')
    .replace(/\n$/g, '')

const syncDirs = (destDir, sourceLangs) => {
  sourceLangs.forEach((lang) => {
    const dir = path.join(destDir, lang)
    if (!fs.existsSync(dir)) {
      console.log('creating new dir: ', dir)
      fs.mkdirSync(dir)
    }
  })
}

const syncStrings = (sourceDir, destDir) => {
  sourceDir = path.join(sourceDir, 'app', '_locales')
  destDir = path.join(destDir, 'app', '_locales')

  assertDirExists(sourceDir)
  assertDirExists(destDir)

  const sourceLangStringsMap = getLangStringsMap(sourceDir)
  const destLangStringsMap = getLangStringsMap(destDir, (lang) => lang === 'en')
  const sourceLangs = Object.keys(sourceLangStringsMap)

  syncDirs(destDir, sourceLangs)
  syncLangStrings(destDir, sourceLangStringsMap, destLangStringsMap)

  console.log(`Syncing from sourceDir: ${sourceDir} to destDir: ${destDir}`)

  // Read in all strings for all languages from sourceDir
  // Read in all strings for all languges from destDir
}

module.exports = syncStrings
