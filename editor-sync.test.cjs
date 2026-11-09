const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(__dirname + '/index.html', 'utf8');
const sync = source.slice(source.indexOf('  function syncVersionFromEditor()'), source.indexOf('  function saveVersion()'));
const wiring = source.split('\n').filter(line => /\$\("version(Name|Content)"\)\.oninput\s*=/.test(line)).join('\n');
for (const field of ['versionName', 'versionContent']) {
 test(`typing ${field} saves the current draft before selection changes`, () => {
  const a = { name: '原名', content: '原文' }, b = { name: '其他版本', content: '其他内容' };
  let current = a;
  const fields = { versionName: { value: a.name }, versionContent: { value: a.content } };
  const ctx = { currentVersion: () => current, $: id => fields[id] };
  vm.createContext(ctx); vm.runInContext(sync + wiring, ctx);
  fields[field].value = '尚未点击保存的新内容';
  fields[field].oninput?.();
  current = b;
  fields.versionName.value = b.name; fields.versionContent.value = b.content;
  assert.equal(a[field === 'versionName' ? 'name' : 'content'], '尚未点击保存的新内容');
  assert.equal(b.content, '其他内容');
  assert.equal(b.name, '其他版本');
 });
}
