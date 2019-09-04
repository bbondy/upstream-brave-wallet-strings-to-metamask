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
    // Skip the source lang
    .forEach((lang) => {
      const langPath = path.join(dir, lang, 'messages.json')
      const langMap = fs.existsSync(langPath) ? JSON.parse(fs.readFileSync(langPath, 'utf8')) : {}
      langStringsMap[lang] = {}
      Object.keys(langMap).forEach((key) => {
        langStringsMap[lang][key] = langMap[key].message
      })
    })
  return langStringsMap
}

const filterLangs = (lang) =>
  !['index.json'].includes(lang)

const syncLangStrings = (sourceDir, destDir, sourceLangStringsMap, destLangStringsMap) => {
  fs.readdirSync(destDir)
    .filter(filterLangs)
    // Skip the source lang
    .filter((lang) => lang !== 'en')
    .forEach((lang) => {
      const sourceLangPath = path.join(sourceDir, lang, 'messages.json')
      const destLangPath = path.join(destDir, lang, 'messages.json')
      // Create a lang map which is the entire dest dir content
      // this might get overwritten if the dest file already exists
      let langMap = Object.keys(sourceLangStringsMap[lang]).reduce((acc, cur) => {
        acc[cur] = {
          message: sourceLangStringsMap[lang][cur]
        }
        return acc
      }, {})
      let newFile = true
      if (fs.existsSync(sourceLangPath)) {
        langMap = JSON.parse(fs.readFileSync(sourceLangPath, 'utf8'))
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
      // Re-add any removed translations that we didn't have in our source string
      if (destLangStringsMap[lang]) {
        Object.keys(destLangStringsMap.en).forEach((key) => {
          if (!langMap[key] && destLangStringsMap[lang][key]) {
            langMap[key] = { message: destLangStringsMap[lang][key] }
          }
          // Also remove if the string matches the English locale
          if (langMap[key] && langMap[key].message === sourceLangStringsMap.en[key]) {
            delete langMap[key]
          }
        })
      }
      const data = JSON.stringify(langMap, null, 2)
      fs.writeFileSync(destLangPath, data + '\n', 'utf8')
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
  const destLangStringsMap = getLangStringsMap(destDir)
  const sourceLangs = Object.keys(sourceLangStringsMap)

  syncDirs(destDir, sourceLangs)
  syncLangStrings(sourceDir, destDir, sourceLangStringsMap, destLangStringsMap)

  console.log(`Syncing from sourceDir: ${sourceDir} to destDir: ${destDir}`)
}

module.exports = syncStrings
