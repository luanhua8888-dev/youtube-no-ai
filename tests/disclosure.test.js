const test = require('node:test');
const assert = require('node:assert/strict');
require('../filter');
const disclosure = require('../disclosure');
const fixture = require('./fixtures/ai-disclosure.json');

test('nhận diện hai vị trí nhãn thực tế trên video RradgG3cUrE', () => {
  assert.equal(disclosure.hasDisclosure({ contents: fixture.contents }), true);
  assert.equal(disclosure.hasDisclosure({ engagementPanels: fixture.engagementPanels }), true);
  assert.equal(disclosure.inspectHTML(`<script>var ytInitialData = ${JSON.stringify(fixture)};</script>`), true);
});
test('không dùng tiêu đề, mô tả, bình luận, đề xuất hoặc cờ thử nghiệm để suy ra nhãn', () => {
  const unrelated = {
    videoPrimaryInfoRenderer: { title: { runs: [{ text: 'Made with AI' }] } },
    videoSecondaryInfoRenderer: { description: { runs: [{ text: 'Made with AI' }] } },
    secondaryResults: fixture,
    comments: fixture,
    config: { enable_ai_disclosure: true }
  };
  assert.equal(disclosure.hasDisclosure(unrelated), false);
});
test('JSON chứa dấu ngoặc và ký tự escape được đọc mà không chạy script', () => {
  const data = { title: 'A } "quoted" { title', ...fixture };
  assert.deepEqual(disclosure.initialData(`<script>window["ytInitialData"] = ${JSON.stringify(data)}; throw new Error();</script>`), data);
  assert.equal(disclosure.inspectHTML('<html>Consent required</html>'), null);
  assert.equal(disclosure.inspectHTML('var ytInitialData = {broken}'), null);
});
test('nhãn tiếng Việt và phiên bản nhãn cũ', () => {
  assert.equal(disclosure.isLabel('Tạo bằng AI'), true);
  assert.equal(disclosure.isLabel('Altered or synthetic content'), true);
  assert.equal(disclosure.isLabel('Quay bằng camera'), false);
});
