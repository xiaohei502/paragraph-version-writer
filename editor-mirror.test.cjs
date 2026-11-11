const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(__dirname + '/index.html', 'utf8');
const sync = source.slice(source.indexOf('  function syncVersionFromEditor()'), source.indexOf('  function saveVersion()'));
const wiring = source.split('\n').filter(line => /\$\("version(Name|Content)"\)\.oninput\s*=/.test(line)).join('\n');
const mainInput = source.match(/ta.oninput = \(\) => \{([\s\S]*?)\n      \};/)[1];
for (const selectedIsDisplay of [true, false]) {
 test(`side edit mirrors only displayed version (${selectedIsDisplay})`, () => {
  const original = {id:'original',name:'原名',content:'旧正文'};
  const draft = {id:'draft',name:'草稿',content:'草稿正文'};
  const p = {id:'paragraph',displayVersionId:original.id,versions:[original,draft]};
  let selected = selectedIsDisplay ? original : draft;
  const ta = {dataset:{id:p.id},value:original.content};
  const other = {dataset:{id:'other'},value:'另一段'};
  const fields = {versionName:{value:selected.name},versionContent:{value:'侧栏的新正文'}};
  const ctx = {currentVersion:()=>selected,currentParagraph:()=>p,currentChapter:()=>({paragraphs:[p]}),displayVersion:()=>original,
   $: id => fields[id],document:{querySelectorAll:()=>[ta,other]},renderStats:()=>{},updateVersionEditorIfSelected:()=>{},ta};
  vm.createContext(ctx);vm.runInContext(sync+wiring,ctx);
  fields.versionContent.oninput();
  assert.equal(selected.content,'侧栏的新正文');
  assert.equal(ta.value,selectedIsDisplay?'侧栏的新正文':'旧正文');
  assert.equal(other.value,'另一段');
  // Resume typing centrally, as after focusing the displayed version.
  selected = original;
  ta.value += '，继续写';
  vm.runInContext(mainInput,ctx);
  assert.equal(original.content,selectedIsDisplay?'侧栏的新正文，继续写':'旧正文，继续写');
  if(!selectedIsDisplay) assert.equal(draft.content,'侧栏的新正文');
 });
}
