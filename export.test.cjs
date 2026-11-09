const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

for (const trigger of ['button', 'Control+s', 'Meta+s']) {
  test(`immediate JSON export includes editor changes (${trigger})`, async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
    try {
      const page = await browser.newPage();
      await page.goto(pathToFileURL(path.join(__dirname, 'index.html')).href);
      await page.evaluate(() => {
        window.exports = [];
        URL.createObjectURL = blob => { window.exports.push(blob); return 'blob:test'; };
        HTMLAnchorElement.prototype.click = function () {};
      });
      await page.locator('#versionList .version').nth(1).click();
      await page.locator('#versionName').fill('即刻保存的名字');
      await page.locator('#versionContent').fill('最新修改，不等三十秒。');
      const exportNow = async () => {
        if (trigger === 'button') await page.locator('#exportProjectBtn').click();
        else await page.keyboard.press(trigger);
        return page.evaluate(async () => JSON.parse(await window.exports.at(-1).text()));
      };
      const data = await exportNow();
      const p = data.chapters[0].paragraphs[0];
      const v = p.versions.find(v => v.id === data.versionId);
      assert.equal(v.name, '即刻保存的名字');
      assert.equal(v.content, '最新修改，不等三十秒。');
      assert.notEqual(p.displayVersionId, v.id, 'export must not change the display version');
      await page.locator('#versionContent').fill('');
      assert.equal((await exportNow()).chapters[0].paragraphs[0].versions.find(x => x.id === v.id).content, '');
      await page.locator('#versionList .version').first().click();
      await page.locator('.paraText').first().fill('主编辑器的最新内容');
      assert.equal((await exportNow()).chapters[0].paragraphs[0].versions[0].content, '主编辑器的最新内容');
    } finally { await browser.close(); }
  });
}
