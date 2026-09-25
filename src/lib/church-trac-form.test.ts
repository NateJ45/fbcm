// scaffold-file: church
// A Church Trac form's pasted embed code (src/lib/church-trac-form.ts): only
// an https churchtrac.com address survives, whatever else was pasted.
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkPaste, formHeight, formSrc, FORM_SIZES } from './church-trac-form.ts';

const CODE =
  '<iframe src="https://www.churchtrac.com/connect_form?ui=0C7B1090&amp;id=42" style="width:100%; height:600px;"></iframe>';

test('the address comes out of Church Trac embed code, unescaped', () => {
  assert.equal(formSrc(CODE), 'https://www.churchtrac.com/connect_form?ui=0C7B1090&id=42');
  // Single quotes, no quotes, extra attributes before src, line breaks.
  assert.equal(
    formSrc("<iframe title='Give' src='https://fbcmuncie.churchtrac.com/give'></iframe>"),
    'https://fbcmuncie.churchtrac.com/give',
  );
  assert.equal(
    formSrc('<iframe\n  frameborder=0\n  src=https://www.churchtrac.com/f?x=1></iframe>'),
    'https://www.churchtrac.com/f?x=1',
  );
});

test('a bare Church Trac address works too', () => {
  assert.equal(
    formSrc('  https://fbcmuncie.churchtrac.com/connectcard  '),
    'https://fbcmuncie.churchtrac.com/connectcard',
  );
});

test('anything that is not an https Church Trac address is refused', () => {
  assert.equal(formSrc('<iframe src="https://evil.example/form"></iframe>'), null);
  assert.equal(formSrc('<iframe src="https://churchtrac.com.evil.example/"></iframe>'), null);
  assert.equal(formSrc('<iframe src="http://www.churchtrac.com/form"></iframe>'), null);
  assert.equal(formSrc('<iframe src="javascript:alert(1)"></iframe>'), null);
  assert.equal(formSrc('<script src="https://www.churchtrac.com/x.js"></script>'), null);
  assert.equal(formSrc('https://user:pw@www.churchtrac.com/form'), null);
  assert.equal(formSrc('Connection card'), null);
  assert.equal(formSrc(''), null);
  assert.equal(formSrc(undefined), null);
});

test('only the iframe address is kept: scripts and styles in the paste are dropped', () => {
  const pasted = `${CODE}<script>document.cookie</script>`;
  assert.equal(formSrc(pasted), 'https://www.churchtrac.com/connect_form?ui=0C7B1090&id=42');
});

test('stega markers from the Studio preview do not break the address', () => {
  // Invisible characters the preview hides in every string.
  assert.equal(
    formSrc(`\u200B${CODE}\u200C\uFEFF`),
    'https://www.churchtrac.com/connect_form?ui=0C7B1090&id=42',
  );
});

test("the Studio's messages are for staff", () => {
  assert.equal(checkPaste(CODE), true);
  assert.match(String(checkPaste('')), /Paste the embed code/);
  assert.match(String(checkPaste('<script src="x"></script>')), /no form frame/);
  assert.match(String(checkPaste('<iframe src="http://www.churchtrac.com/f"></iframe>')), /https/);
  assert.match(
    String(checkPaste('<iframe src="https://forms.google.com/x"></iframe>')),
    /Church Trac/,
  );
});

test('form size: short, medium or long; medium when unset', () => {
  assert.equal(formHeight('short'), FORM_SIZES.short);
  assert.equal(formHeight('long'), FORM_SIZES.long);
  assert.equal(formHeight(undefined), FORM_SIZES.medium);
  assert.equal(formHeight('enormous'), FORM_SIZES.medium);
  assert.equal(formHeight('long\u200B'), FORM_SIZES.long);
});
