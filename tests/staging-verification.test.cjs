const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../apps-script/StagingVerification.gs'),'utf8');
function run(book, entities={}) {
  const context={SpreadsheetApp:{getActiveSpreadsheet:()=>book},ENTITIES:entities};
  vm.createContext(context);vm.runInContext(source,context);
  context.verifyPublicBoundaryInGoogle();
}
test('Google staging runner refuses missing, production, populated and application workbooks before writing',()=>{
  assert.throws(()=>run(null),/new test workbook/);
  assert.throws(()=>run({getName:()=> 'Production'}),/new test workbook/);
  const empty={getLastRow:()=>0};
  const base={getName:()=> 'F&B ISOLATED BOUNDARY TEST',getSheets:()=>[empty]};
  assert.throws(()=>run({...base,getSheets:()=>[empty,empty]}),/one completely empty sheet/);
  assert.throws(()=>run({...base,getSheets:()=>[{getLastRow:()=>1}]}),/one completely empty sheet/);
  assert.throws(()=>run({...base,getSheetByName:()=>empty},{collab:{sheetName:'Collabs'}}),/application tab already exists/);
});
