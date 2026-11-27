const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('Artist Display Name & Privacy Protection Tests', async () => {
  const { formatArtistDisplayName } = await import('../app/utils/nameFormatter.js');

  it('masks personal names with suffixes to first name + suffix (e.g. Vishall Live)', () => {
    assert.strictEqual(formatArtistDisplayName('VISHALL PANDEY', 'Vishall P. Live'), 'Vishall Live');
    assert.strictEqual(formatArtistDisplayName('VISHALL PANDEY', 'Vishall pandey live'), 'Vishall Live');
    assert.strictEqual(formatArtistDisplayName('Aman Verma', 'Aman Live'), 'Aman Live');
  });

  it('masks personal names without suffix to first name only (e.g. Vishall, Sarvesh)', () => {
    assert.strictEqual(formatArtistDisplayName('VISHALL PANDEY', 'Vishall P.'), 'Vishall');
    assert.strictEqual(formatArtistDisplayName('VISHALL PANDEY', ''), 'Vishall');
    assert.strictEqual(formatArtistDisplayName('Sarvesh Gawas', 'Sarvesh Gawas'), 'Sarvesh');
    assert.strictEqual(formatArtistDisplayName('Rajvi Jigneshkumar Prajapati', ''), 'Rajvi');
  });

  it('preserves established stage names, band names, and DJ monikers', () => {
    assert.strictEqual(formatArtistDisplayName('Ekyum Singh Sawhney', 'Akum'), 'Akum');
    assert.strictEqual(formatArtistDisplayName('Rajvi Jigneshkumar Prajapati', 'Rajvi'), 'Rajvi');
    assert.strictEqual(formatArtistDisplayName('The Local Train', 'The Local Train'), 'The Local Train');
    assert.strictEqual(formatArtistDisplayName('Euphonic Band', 'Euphonic Band'), 'Euphonic Band');
    assert.strictEqual(formatArtistDisplayName('Bhuvaneshwar Bonala', 'DJ CHINNA'), 'DJ Chinna');
    assert.strictEqual(formatArtistDisplayName('Vipul Kumar', 'VIP Live'), 'VIP Live');
    assert.strictEqual(formatArtistDisplayName('Arman Azmi', 'Azmi Live'), 'Azmi Live');
    assert.strictEqual(formatArtistDisplayName('Tishnagi Band', 'TN Live'), 'TN Live');
    assert.strictEqual(formatArtistDisplayName('Gaurav', 'H24 Live'), 'H24 Live');
  });
});
