import { describe, it, expect } from 'vitest';
import { splitToChars } from '../../utils';

describe('splitToChars', () => {
  it('preserves alphanumeric DDO code / cost center letters like BM6254', () => {
    expect(splitToChars('BM6254', 6)).toEqual(['B', 'M', '6', '2', '5', '4']);
    expect(splitToChars('BM6254', 6, false)).toEqual(['B', 'M', '6', '2', '5', '4']);
    expect(splitToChars('bm6254'.toUpperCase(), 6, false)).toEqual(['B', 'M', '6', '2', '5', '4']);
  });

  it('strips non-digits from CNIC or numeric strings by default', () => {
    expect(splitToChars('13101-1234567-1', 13)).toEqual([
      '1', '3', '1', '0', '1', '1', '2', '3', '4', '5', '6', '7', '1'
    ]);
  });

  it('pads left when padLeft option is provided', () => {
    expect(splitToChars('15', 2, { padLeft: '0' })).toEqual(['1', '5']);
    expect(splitToChars('7', 2, { padLeft: '0' })).toEqual(['0', '7']);
    expect(splitToChars('3244040', 8, { padLeft: '0' })).toEqual(['0', '3', '2', '4', '4', '0', '4', '0']);
    expect(splitToChars('03244040', 8, { padLeft: '0' })).toEqual(['0', '3', '2', '4', '4', '0', '4', '0']);
    expect(splitToChars('', 8, { padLeft: '0' })).toEqual(['', '', '', '', '', '', '', '']);
  });
});
