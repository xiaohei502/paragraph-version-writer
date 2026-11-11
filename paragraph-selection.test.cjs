const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/index.html','utf8');
const code=source.slice(source.indexOf('  function selectParagraph('),source.indexOf('  function normalizeOrders('));
function setup(visible=['a','b']){
 const paragraphs=['a','b'].map(id=>({id,displayVersionId:id+'-v'}));
 const cards=visible.map(id=>({dataset:{id},active:id==='a',classList:{toggle(name,on){assert.equal(name,'active');cards.find(c=>c.dataset.id===id).active=on;}}}));
 const box={querySelectorAll:selector=>{assert.equal(selector,'.paragraph');return cards;}};
 Object.defineProperty(box,'innerHTML',{set(){throw Error('must not rebuild focused editor');}});
 const ctx={app:{paragraphId:'a',versionId:'a-v'},currentChapter:()=>({paragraphs}),$:id=>{assert.equal(id,'editorWrap');return box;},render:()=>{throw Error('unexpected full render');},renderVersions:()=>{ctx.sideRenders++;},sideRenders:0};
 vm.createContext(ctx);vm.runInContext(code,ctx);
 return {ctx,cards};
}
test('focus selection moves highlight without rebuilding central editor',()=>{
 const {ctx,cards}=setup();
 for(const id of ['b','a','b']){
  ctx.selectParagraph(id,false);
  assert.equal(ctx.app.paragraphId,id);assert.equal(ctx.app.versionId,id+'-v');
  assert.deepEqual(cards.filter(c=>c.active).map(c=>c.dataset.id),[id]);
 }
 assert.equal(ctx.sideRenders,3);
});
test('filtered visible card gets highlight',()=>{const {ctx,cards}=setup(['b']);ctx.selectParagraph('b',false);assert.equal(cards[0].active,true);});
test('unknown paragraph leaves selection alone',()=>{const {ctx,cards}=setup();ctx.selectParagraph('missing',false);assert.equal(ctx.app.paragraphId,'a');assert.equal(cards[0].active,true);assert.equal(ctx.sideRenders,0);});
