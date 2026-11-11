const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const code=html.slice(html.indexOf('  function renderParagraphs()'),html.indexOf('  function getPara('));
function setup(){
 const paragraphs=[{id:'third',order:30,content:'命中 三'},{id:'first',order:10,content:'一'},{id:'second',order:20,content:'命中 二'}];
 const box={innerHTML:'',querySelectorAll:()=>[]};const search={value:''};const add={};
 const ctx={app:{paragraphId:'second'},currentChapter:()=>({paragraphs}),$:id=>({editorWrap:box,searchInput:search,addParaEndBtn2:add}[id]),displayVersion:p=>p,esc:s=>s};
 vm.createContext(ctx);vm.runInContext(code,ctx);
 const labels=()=>Array.from(box.innerHTML.matchAll(/<div class="paraTitle">(段落\d+)/g),m=>m[1]);
 return {ctx,paragraphs,box,search,labels};
}
test('filter keeps original sorted chapter numbers, not result positions',()=>{
 const {ctx,search,labels,paragraphs}=setup();search.value='命中';ctx.renderParagraphs();assert.deepEqual(labels(),['段落002','段落003']);assert.deepEqual(paragraphs.map(p=>p.id),['third','first','second']);
});
test('clearing and repeating search restores full numbering',()=>{
 const {ctx,search,labels}=setup();for(const [key,expected] of [['三',['段落003']],['', ['段落001','段落002','段落003']],['missing',[]],[' 命中 ',['段落002','段落003']]]){search.value=key;ctx.renderParagraphs();assert.deepEqual(labels(),expected);}
});
test('numbering follows changed chapter order while filtered',()=>{
 const {ctx,search,labels,paragraphs}=setup();paragraphs[0].order=0;search.value='三';ctx.renderParagraphs();assert.deepEqual(labels(),['段落001']);
});
