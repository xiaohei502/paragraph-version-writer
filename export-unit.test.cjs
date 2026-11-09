const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(__dirname + '/index.html', 'utf8');
const sync = source.slice(source.indexOf('  function syncVersionFromEditor()'), source.indexOf('  function saveVersion()'));
const exp = source.slice(source.indexOf('  function exportProject()'), source.indexOf('  $("importProjectBtn").onclick'));
for (const [name, content] of [['新名字', '最新修改'], ['', ''], [' 空白 ', '多行\n第二行']]) {
  test('export synchronizes name and content: ' + JSON.stringify([name, content]), () => {
    const version = {id:'draft',name:'旧名字',content:'旧内容'};
    const app = {chapters:[{paragraphs:[{displayVersionId:'original',versions:[{id:'original',content:'原稿'}, version]}]}], versionId:'draft'};
    const ctx = {app, currentVersion:()=>version, $: id => ({value:id==='versionName'?name:content}), saveFile: (filename, text)=>{ctx.result = JSON.parse(text);}};
    vm.createContext(ctx); vm.runInContext(sync+exp+'exportProject();', ctx);
    const p = ctx.result.chapters[0].paragraphs[0];
    assert.equal(p.versions[1].content, content);
    assert.equal(p.versions[1].name, name.trim() || '未命名版本');
    assert.equal(p.displayVersionId, 'original');
    assert.equal(p.versions[0].content, '原稿');
    ctx.$ = id => ({value:id==='versionName'?'第二次':'再次导出'});
    vm.runInContext('exportProject();',ctx);
    assert.equal(ctx.result.chapters[0].paragraphs[0].versions[1].content,'再次导出');
  });
}
test('empty selection can still export',()=>{
 const ctx={app:{chapters:[]},currentVersion:()=>null,saveFile:(n,t)=>ctx.result=JSON.parse(t)};
 vm.createContext(ctx);vm.runInContext(sync+exp+'exportProject();',ctx);
 assert.equal(ctx.result.chapters.length,0);
});
