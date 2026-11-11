const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(__dirname+'/index.html','utf8');
const code = source.slice(source.indexOf('  function validateProject(') < 0 ? source.indexOf('  function importJson(') : source.indexOf('  function validateProject('),source.indexOf('  function openImportModal('));
const valid = () => ({chapters:[{id:'c',title:'章节',paragraphs:[{id:'p',order:0,displayVersionId:'v',versions:[{id:'v',name:'版本',content:'正文',date:'2026-11-11',display:true}]}]}],chapterId:'c',paragraphId:'p',versionId:'v'});
function setup(accept=true){
 const old=valid();old.chapters[0].title='保留当前草稿';
 const ctx={app:old,confirm:()=>{ctx.prompts++;return accept;},prompts:0,render:()=>{ctx.renders++;},renders:0};
 vm.createContext(ctx);
 vm.runInContext(source.slice(source.indexOf('  function currentChapter()'),source.indexOf('  function ensure()'))+code,ctx);
 return {ctx,old};
}
const invalid = [null,{}, {chapters:[{}]}, {chapters:[null]}, {chapters:[]}, ...[
 d=>d.chapters[0].paragraphs={},d=>d.chapters[0].paragraphs=[null],d=>d.chapters[0].paragraphs[0].versions=[],
 d=>d.chapters[0].paragraphs[0].versions[0].content={},d=>d.chapters[0].paragraphs[0].displayVersionId='missing',
 d=>d.chapters.push(structuredClone(d.chapters[0])),d=>d.chapters[0].paragraphs[0].order='bad',
 d=>d.chapters[0].paragraphs[0].versions[0].id='" onclick="bad',
].map(change=>{const d=valid();change(d);return d;})];
invalid.forEach((value,i)=>test(`invalid nested import ${i} leaves old state untouched`,()=>{
 const {ctx,old}=setup(); assert.throws(()=>ctx.importJson(JSON.stringify(value))); assert.equal(ctx.app,old);assert.equal(ctx.renders,0);assert.equal(ctx.prompts,0);
}));
test('cancel valid replacement preserves current project',()=>{const {ctx,old}=setup(false);assert.equal(ctx.importJson(JSON.stringify(valid())),false);assert.equal(ctx.app,old);assert.equal(ctx.renders,0);});
test('valid import resolves stale selections and preserves contents',()=>{const {ctx}=setup();const d=valid();d.chapterId='stale';d.paragraphId='stale';d.versionId='stale';assert.equal(ctx.importJson(JSON.stringify(d)),true);assert.equal(ctx.app.chapterId,'c');assert.equal(ctx.app.paragraphId,'p');assert.equal(ctx.app.versionId,'v');assert.equal(ctx.app.chapters[0].paragraphs[0].versions[0].content,'正文');assert.equal(ctx.renders,1);assert.equal(ctx.prompts,1);});
test('invalid JSON syntax leaves current project untouched',()=>{const {ctx,old}=setup();assert.throws(()=>ctx.importJson('{'));assert.equal(ctx.app,old);});
test('export-shaped multiple chapters and versions round trip',()=>{
 const {ctx}=setup();const d=valid();
 d.chapters[0].paragraphs[0].versions.push({id:'draft',name:'草稿',content:'\n多行\n',date:'2026-11-11',display:false});d.versionId='draft';
 d.chapters.push({id:'second',title:'第二章',paragraphs:[{id:'p2',order:0,displayVersionId:'v2',versions:[{id:'v2',name:'空白',content:'',date:'2026-11-11'}]}]});
 ctx.importJson(JSON.stringify(d));assert.equal(JSON.stringify(ctx.app.chapters),JSON.stringify(d.chapters));assert.equal(ctx.app.versionId,'draft');
 const imported=ctx.app;assert.throws(()=>ctx.importJson('{"chapters":[{}]}'));assert.equal(ctx.app,imported);
});
