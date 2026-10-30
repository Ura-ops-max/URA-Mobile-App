import { buyerOrderMessage, toWhatsAppNumber, whatsAppLink } from '@/lib/whatsapp';

describe('toWhatsAppNumber', () => {
  it('accepts Nigerian formats', () => {
    expect(toWhatsAppNumber('08031234567')).toBe('2348031234567');
    expect(toWhatsAppNumber('+234 803 123 4567')).toBe('2348031234567');
    expect(toWhatsAppNumber('234-803-123-4567')).toBe('2348031234567');
  });

  it('rejects anything else, so no button is shown', () => {
    expect(toWhatsAppNumber('')).toBeNull();
    expect(toWhatsAppNumber(null)).toBeNull();
    expect(toWhatsAppNumber('0803123')).toBeNull();
    expect(toWhatsAppNumber('abc08031234567')).toBeNull();
  });
});

it('builds an encoded wa.me link', () => {
  expect(whatsAppLink('08031234567', 'Hi & bye')).toBe('https://wa.me/2348031234567?text=Hi%20%26%20bye');
  expect(whatsAppLink('bad', 'x')).toBeNull();
});

describe('buyerOrderMessage', () => {
  const base = { shopName: 'Mama Put', orderNumber: 'ORD-1', items: [{ name: 'Rice', quantity: 2 }], totalText: '₦5,000' };

  it('paid pickup', () => {
    expect(buyerOrderMessage({ ...base, paid: true, includeItems: true })).toBe(
      'Hi Mama Put, I just paid for order ORD-1: 2x Rice. Total ₦5,000. I will pick it up.',
    );
  });

  it('failed payment asks for help', () => {
    expect(buyerOrderMessage({ ...base, paid: false, includeItems: false })).toBe(
      'Hi Mama Put, I tried to pay for order ORD-1. Total ₦5,000. My payment did not go through. Can you help?',
    );
  });

  it('paid delivery includes the address', () => {
    expect(
      buyerOrderMessage({ ...base, paid: true, includeItems: true, deliveryMethod: 'delivery', address: '1 Main St, Abuja' }),
    ).toBe('Hi Mama Put, I just paid for order ORD-1: 2x Rice. Total ₦5,000. My address is 1 Main St, Abuja.');
  });
});
