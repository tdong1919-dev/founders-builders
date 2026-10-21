/**
 * @OnlyCurrentDoc
 * Manual staging runner. Add beside Code.gs in a NEW, bound test workbook.
 * Never install in the production script and never deploy this runner.
 */
function verifyPublicBoundaryInGoogle() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var marker = 'F&B ISOLATED BOUNDARY TEST';
  if (!book || book.getName() !== marker) throw new Error('Use a new test workbook named exactly: ' + marker);
  var existing = book.getSheets();
  if (existing.length !== 1 || existing[0].getLastRow() !== 0) {
    throw new Error('Safety guard: test requires one completely empty sheet. Create a new workbook for each run.');
  }
  if (Object.keys(ENTITIES).some(function(type) { return !!book.getSheetByName(ENTITIES[type].sheetName); })) {
    throw new Error('Safety guard: an application tab already exists.');
  }
  var results = existing[0];
  results.setName('Verification');
  results.appendRow(['Check', 'Result', 'Detail']);
  var failures = 0;
  function check(name, action) {
    try { action(); results.appendRow([name, 'PASS', '']); }
    catch (error) { failures++; results.appendRow([name, 'FAIL', String(error.message || error)]); }
  }
  function expect(value, message) { if (!value) throw new Error(message); }
  function read(type, extra) { return doGet({parameter:Object.assign({type:type}, extra || {})}); }
  function json(output) { return JSON.parse(output.getContent()); }
  function post(data) { return json(doPost({postData:{contents:JSON.stringify(data)}})); }
  check('Private reads and administrative writes denied without creating tabs', function() {
    var count = book.getSheets().length;
    Object.keys(ENTITIES).forEach(function(type) {
      if (ENTITIES[type].public === false) expect(json(read(type)).ok === false, type);
    });
    ['account', 'savedItem', 'adminAction', '__proto__'].forEach(function(type) {
      expect(post({type:type,name:'Fictional person',email:'fictional@example.com'}).ok === false, type);
    });
    expect(book.getSheets().length === count, 'Denied routes created tabs');
  });
  check('Invalid JSONP callback rejected', function() {
    expect(json(read('collab', {callback:'x.y'})).ok === false, 'Callback accepted');
  });
  check('Public append and server-managed metadata', function() {
    expect(post({type:'collab',title:'Fictional staging task',email:'fictional@example.com',ownerKey:'FORBIDDEN',verified:'Yes',moderationStatus:'Approved'}).ok === true, 'Append failed');
    var sheet = book.getSheetByName('Collabs');
    var rows = sheet.getDataRange().getValues();
    var header = rows[0], saved = rows[1];
    expect(saved[header.indexOf('ownerKey')] === '', 'Owner key accepted');
    expect(saved[header.indexOf('verified')] === '', 'Verification accepted');
    expect(saved[header.indexOf('moderationStatus')] === 'Active', 'Moderation overridden');
    var output = json(read('collab'));
    expect(output.ok && output.count === 1 && output.profiles.length === 1, 'Response contract failed');
    expect(!Object.prototype.hasOwnProperty.call(output.records[0], 'ownerKey'), 'Private field returned');
    sheet.getRange(2, header.indexOf('moderationStatus') + 1).setValue('Hidden');
    expect(json(read('collab')).count === 0, 'Hidden row published');
  });
  check('Formula-leading input remains literal in actual Google cells', function() {
    ['=1+1', '+1+1', '-1+1', '@SUM(1)'].forEach(function(title) {
      expect(post({type:'collab',title:title,email:'fictional@example.com'}).ok === true, 'Append failed');
      var sheet = book.getSheetByName('Collabs');
      var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
      var cell = sheet.getRange(sheet.getLastRow(), headers.indexOf('title') + 1);
      SpreadsheetApp.flush();
      expect(cell.getFormula() === '', 'Formula evaluated: ' + title);
      expect(cell.getValue() === title, 'Literal did not round-trip: ' + title);
    });
  });
  check('Private intake accepts a request but denies reads', function() {
    expect(post({type:'report',reason:'Spam',details:'Fictional staging report',reporterEmail:'fictional@example.com',status:'Resolved'}).ok === true, 'Intake failed');
    expect(json(read('report')).ok === false, 'Intake exposed');
    var rows = book.getSheetByName(ENTITIES.report.sheetName).getDataRange().getValues();
    expect(rows[1][rows[0].indexOf('status')] !== 'Resolved', 'Workflow overridden');
  });
  check('Investor classification survives routing', function() {
    expect(post({type:'investor',investorType:'Angel',name:'Fictional investor',email:'fictional@example.com'}).ok === true, 'Append failed');
    expect(json(read('investor')).records[0].type === 'Angel', 'Classification lost');
  });
  SpreadsheetApp.flush();
  if (failures) throw new Error(failures + ' staging checks failed. Read Verification tab; do not deploy.');
  console.log('All 6 isolated Google runtime checks passed. No HTTP deployment or production data was tested.');
}
