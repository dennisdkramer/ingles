const fs = require('fs');
const { JSDOM } = require('jsdom');
const nums = process.argv.slice(2).map(Number);
for (const n of nums) {
  const f = 'kids/lesson' + n + '.html';
  const t = fs.readFileSync(f, 'utf8');
  const d = new JSDOM(t).window.document;
  const stems = [...d.querySelectorAll('.qstem')].map(s => s.textContent.replace(/\s+/g, ' ').trim());
  const say = [...d.querySelectorAll('[data-say]')].map(b => b.getAttribute('data-say'));
  const dupStem = [...new Set(stems.filter((s, i) => stems.indexOf(s) !== i))];
  const dupSay = [...new Set(say.filter((s, i) => say.indexOf(s) !== i))];
  const radios = [...d.querySelectorAll('input[type=radio]')];
  const names = [...new Set(radios.map(r => r.name))];
  const noGroup = names.filter(nm => radios.filter(r => r.name === nm).length < 2);
  console.log(f,
    '| h2', d.querySelectorAll('h2').length,
    '| tables', d.querySelectorAll('table.chart').length,
    '| stems', stems.length,
    '| dupStem', JSON.stringify(dupStem),
    '| dupSay', JSON.stringify(dupSay),
    '| gaps', d.querySelectorAll('input.gap').length,
    '| radios', radios.length,
    '| singleRadioGroups', JSON.stringify(noGroup),
    '| divbal', t.split('<div').length - t.split('</div>').length,
    '| tbal', t.split('<table').length - t.split('</table>').length,
    '| tbodybal', t.split('<tbody').length - t.split('</tbody>').length,
    '| feed', !!d.querySelector('#feed'),
    '| L', /L=\d/.test(t),
    '| bareAudioStem', [...d.querySelectorAll('.qstem')].filter(s => s.textContent.replace(/[▶\s]/g, '') === '').length,
    '| ptMarked', (t.match(/class="ptw"/g) || []).length);
}
