import { formatDateTime, formatMoney, toCurrencyCode, toDate } from '@/lib/money';

it('never throws on bad currencies (Payluk sometimes sends "NG")', () => {
  expect(toCurrencyCode('NG')).toBe('NGN');
  expect(toCurrencyCode(undefined)).toBe('NGN');
  expect(formatMoney(12500, 'NG')).toBe('₦12,500');
  expect(formatMoney('oops')).toBe('₦0');
});

it('reads Unix-seconds strings and rejects bad dates', () => {
  expect(toDate('1782373118')?.getTime()).toBe(1782373118 * 1000);
  expect(toDate('not a date')).toBeNull();
  expect(toDate(null)).toBeNull();
  expect(formatDateTime(undefined)).toBe('');
});
