const puppeteer = require('puppeteer')
const { Browser } = require('puppeteer/lib/Browser')

/**
 * @returns {Promise<Browser>}
 */
async function launchBrowser() {
  return puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: !process.env.DEBUG_TEST,
    slowMo: process.env.DEBUG_TEST ? 0 : 0,
  })
}

module.exports = {
  launchBrowser
}