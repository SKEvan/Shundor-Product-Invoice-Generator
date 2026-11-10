import { describe, expect, it } from 'vitest';
import { parseOrder } from './parseOrder';

const TEMPLATE_FOOTER = `
🔴 এবং ডেলিভারি চার্জ পরিমান টাকা ঢাকার ভিতরে ৮০টাকা এবং ঢাকার বাইরে ১২০ টাকা এডভান্স করতে হবে।

🦋 Send Money
Bkash- 01736528481
Nagad - 01858931317

আপনাকে অনেক ধন্যবাদ ✨🌼`;

const itemsOf = (text: string) =>
  parseOrder(text).items.map(({ productName, color, quantity, unitPrice }) => ({ productName, color, quantity, unitPrice }));

const chargesOf = (text: string) => {
  const { deliveryZone, deliveryCharge, discount, advancePaid, advanceMethod } = parseOrder(text);
  return { deliveryZone, deliveryCharge, discount, advancePaid, advanceMethod };
};

describe('parseOrder — Bangla template', () => {
  it('reads a normally filled template', () => {
    const order = parseOrder(`অর্ডার কনফার্ম করতে ✅

নাম: rahim uddin
মোবাইল নম্বর( English): 01712345678
ঠিকানা: House 12, Road 5, Dhanmondi
থানা: Dhanmondi
পন্যের নাম/রঙ: Lipstick Red x2, Handbag Black 1
${TEMPLATE_FOOTER}`);

    expect(order.customer).toEqual({
      name: 'Rahim Uddin',
      phone: '01712345678',
      address: 'House 12, Road 5, Dhanmondi',
      thana: 'Dhanmondi',
    });
    expect(order.items.map(({ productName, color, quantity }) => ({ productName, color, quantity }))).toEqual([
      { productName: 'Lipstick', color: 'Red', quantity: 2 },
      { productName: 'Handbag', color: 'Black', quantity: 1 },
    ]);
    expect(order.deliveryZone).toBe('inside_dhaka');
    expect(order.deliveryZoneDetected).toBe(true);
    // Template default: the delivery charge was paid in advance.
    expect(order.deliveryCharge).toBe(80);
    expect(order.advancePaid).toBe(80);
    expect(order.warnings).toEqual([]);
  });

  it('handles values on the next line, multi-line addresses and Bangla digits', () => {
    const order = parseOrder(`নাম:
Fatema Akter
মোবাইল নম্বর( English):
+880 ১৮১২-৩৪৫৬৭৮
ঠিকানা:
Flat 3B, Green View
Area 5, Block C
থানা ঃ Kotwali
পন্যের নাম/রঙ:
1. Face serum 30ml - 1pc
2. Scarf, Navy Blue, 3
${TEMPLATE_FOOTER}`);

    expect(order.customer.name).toBe('Fatema Akter');
    expect(order.customer.phone).toBe('01812345678');
    expect(order.customer.address).toBe('Flat 3B, Green View, Area 5, Block C');
    expect(order.customer.thana).toBe('Kotwali');
    expect(order.items.map(({ productName, color, quantity }) => ({ productName, color, quantity }))).toEqual([
      { productName: 'Face serum 30ml', color: '', quantity: 1 },
      { productName: 'Scarf', color: 'Navy Blue', quantity: 3 },
    ]);
  });

  it('marks outside Dhaka and never takes the shop’s own bKash/Nagad numbers as the buyer’s phone', () => {
    const order = parseOrder(`নাম: Karim
মোবাইল নম্বর( English):
ঠিকানা: College Road, Savar, Dhaka
থানা: Savar
পন্যের নাম/রঙ: Perfume
${TEMPLATE_FOOTER}`);

    expect(order.deliveryZone).toBe('outside_dhaka');
    expect(order.deliveryCharge).toBe(120);
    expect(order.customer.phone).toBe('');
    expect(order.warnings).toContain('Mobile number not found');
    expect(order.items).toHaveLength(1);
  });

  it('warns about missing and invalid fields', () => {
    const order = parseOrder(`নাম:
মোবাইল নম্বর( English): 01712
ঠিকানা: Somewhere
থানা:
পন্যের নাম/রঙ:
${TEMPLATE_FOOTER}`);

    expect(order.warnings).toEqual([
      'Name not found',
      'Mobile number "01712" doesn\'t look right',
      'Couldn’t tell if this is inside Dhaka — please check the delivery zone',
      'No products found — add them below',
    ]);
  });

  it('fills prices written in the template or on Price lines', () => {
    expect(itemsOf(`নাম: A\nমোবাইল নম্বর( English): 01712345678\nঠিকানা: Mirpur\nপন্যের নাম/রঙ: Kitty clock 500tk`)).toEqual([
      { productName: 'Kitty clock', color: '', quantity: 1, unitPrice: 500 },
    ]);
    expect(itemsOf(`নাম: A\nমোবাইল নম্বর( English): 01712345678\nঠিকানা: Mirpur\nপন্যের নাম/রঙ: Kitty clock\nPrice 500tk`)).toEqual([
      { productName: 'Kitty clock', color: '', quantity: 1, unitPrice: 500 },
    ]);
  });
});

describe('parseOrder — English labels', () => {
  it('accepts labels with colons and WhatsApp bold markers', () => {
    const order = parseOrder(`*Name:* Nusrat Jahan
*Phone:* 01555-123456
*Address:* Road 7, Uttara Sector 4
*Thana:* Uttara West
*Product:* Hijab pink 2pcs`);

    expect(order.customer.name).toBe('Nusrat Jahan');
    expect(order.customer.phone).toBe('01555123456');
    expect(order.customer.thana).toBe('Uttara West');
    expect(order.items[0]).toMatchObject({ productName: 'Hijab', color: 'Pink', quantity: 2 });
    expect(order.deliveryZone).toBe('inside_dhaka');
  });

  it('accepts labels without colons', () => {
    const order = parseOrder(`Name Samiya Akter\nPhone 01722922527\nAddress House 3, Road 2, Banani\nProduct Kitty clock`);
    expect(order.customer).toMatchObject({ name: 'Samiya Akter', phone: '01722922527', address: 'House 3, Road 2, Banani' });
    expect(order.items[0].productName).toBe('Kitty clock');
  });
});

describe('parseOrder — free-style messages (no labels)', () => {
  const SAMIYA = `Order Confirmed 

Samiya

8801722922527

Baridiya, Komorpur, Faridpur, Faridpur Sadar, Faridpur, Dhaka,

Bangladesh

Kitty clock 

Price 500tk
Delivery 120tk
Cod 620tk`;

  it('fills everything from the Samiya example', () => {
    const order = parseOrder(SAMIYA);
    expect(order.customer).toEqual({
      name: 'Samiya',
      phone: '01722922527',
      address: 'Baridiya, Komorpur, Faridpur, Faridpur Sadar, Faridpur, Dhaka, Bangladesh',
      thana: 'Faridpur Sadar',
    });
    expect(itemsOf(SAMIYA)).toEqual([{ productName: 'Kitty clock', color: '', quantity: 1, unitPrice: 500 }]);
    // COD 620 = 500 + 120 → nothing was paid in advance.
    expect(chargesOf(SAMIYA)).toEqual({
      deliveryZone: 'outside_dhaka',
      deliveryCharge: 120,
      discount: 0,
      advancePaid: 0,
      advanceMethod: 'none',
    });
    expect(order.warnings).toEqual([]);
  });

  it('works when the name comes after the phone, or on the same line', () => {
    expect(parseOrder(`01722922527\nSamiya\nMirpur 10, Dhaka\nKitty clock`).customer.name).toBe('Samiya');
    const sameLine = parseOrder(`Samiya 01722922527\nMirpur 10, Dhaka\nKitty clock`);
    expect(sameLine.customer).toMatchObject({ name: 'Samiya', phone: '01722922527', thana: 'Mirpur' });
  });

  it('attaches each Price line to the product above it', () => {
    const text = `Rumana\n01812345678\nHouse 4, Road 9, Dhanmondi\nKitty clock\nPrice 500tk\nTeddy bear pink 2pcs\nPrice 700tk\nDelivery 80tk`;
    expect(itemsOf(text)).toEqual([
      { productName: 'Kitty clock', color: '', quantity: 1, unitPrice: 500 },
      { productName: 'Teddy bear', color: 'Pink', quantity: 2, unitPrice: 350 },
    ]);
    expect(chargesOf(text)).toMatchObject({ deliveryZone: 'inside_dhaka', deliveryCharge: 80, advancePaid: 80 });
  });

  it('reads advance, discount and total lines', () => {
    const text = `Rumana\n01812345678\nKhulna Sadar, Khulna\nKitty clock\nTotal 1,070/-\nDelivery charge: 120 tk\nDiscount 50tk\nAdvance 120 tk (nagad)`;
    expect(itemsOf(text)[0].unitPrice).toBe(1000); // 1070 − 120 + 50
    expect(chargesOf(text)).toEqual({
      deliveryZone: 'outside_dhaka',
      deliveryCharge: 120,
      discount: 50,
      advancePaid: 120,
      advanceMethod: 'nagad',
    });
  });

  it('uses the delivery charge to pick the zone when the place is unknown', () => {
    const order = parseOrder(`Rumana\n01812345678\nHouse 4, Some Village\nKitty clock\nPrice 500\nDelivery 80`);
    expect(order.deliveryZone).toBe('inside_dhaka');
    expect(order.deliveryZoneDetected).toBe(true);
  });

  it('warns when the COD in the message doesn’t add up', () => {
    const order = parseOrder(`Rumana\n01812345678\nMirpur, Dhaka\nKitty clock\nPrice 500tk\nDelivery 80tk\nAdvance 80tk\nCod 600tk`);
    expect(order.warnings).toContain('Message says COD Tk 600, but the invoice comes to Tk 500 — please check');
  });

  it('leaves prices empty when none are given', () => {
    expect(itemsOf(`Samiya\n01722922527\nMirpur, Dhaka\nKitty clock\nWall frame black`)).toEqual([
      { productName: 'Kitty clock', color: '', quantity: 1, unitPrice: 0 },
      { productName: 'Wall frame', color: 'Black', quantity: 1, unitPrice: 0 },
    ]);
  });

  it('ignores greetings and understands "each" prices', () => {
    const order = parseOrder(`Assalamualaikum apu\nName: Tania\n01911-223344\nVill: Charpara, Post: Gouripur, Mymensingh\nRing gold 2 pcs\nprice 350 tk each`);
    expect(order.customer).toMatchObject({ name: 'Tania', phone: '01911223344', address: 'Vill: Charpara, Post: Gouripur, Mymensingh' });
    expect(itemsOf(`Tania\n01911223344\nMymensingh\nRing gold 2 pcs\nprice 350 tk each`)).toEqual([
      { productName: 'Ring', color: 'Gold', quantity: 2, unitPrice: 350 },
    ]);
    expect(order.deliveryZone).toBe('outside_dhaka');
    expect(order.warnings).toEqual([]);
  });

  it('splits name, phone and address written on one line', () => {
    const order = parseOrder(`Mitu, 01611223344, House 22 Road 3 Mohammadpur Dhaka\nKitty clock 500`);
    expect(order.customer).toEqual({
      name: 'Mitu',
      phone: '01611223344',
      address: 'House 22 Road 3 Mohammadpur Dhaka',
      thana: 'Mohammadpur',
    });
    expect(itemsOf(`Mitu, 01611223344, Mohammadpur\nKitty clock 500`)).toEqual([
      { productName: 'Kitty clock', color: '', quantity: 1, unitPrice: 500 },
    ]);
  });

  it('handles Bangla names, digits and money labels', () => {
    const text = `সুমি\n০১৭১১২২৩৩৪৪\nUttara sector 7, road 12\nKitty clock\nদাম ৫০০ টাকা\nডেলিভারি ৮০ টাকা`;
    expect(parseOrder(text).customer).toMatchObject({ name: 'সুমি', phone: '01711223344', thana: 'Uttara' });
    expect(itemsOf(text)).toEqual([{ productName: 'Kitty clock', color: '', quantity: 1, unitPrice: 500 }]);
  });

  it('reads mixed English labels with dashes and a bulleted item list', () => {
    const text = `Order details\nCustomer name - Jannat\nMobile no: 01799887766\nAddress - Bashundhara R/A, Block D\nItems:\n- Kitty clock x1\n- Night lamp white x2\nDelivery charge 80`;
    const order = parseOrder(text);
    expect(order.customer).toMatchObject({ name: 'Jannat', phone: '01799887766', address: 'Bashundhara R/A, Block D' });
    expect(itemsOf(text).map((i) => [i.productName, i.color, i.quantity])).toEqual([
      ['Kitty clock', '', 1],
      ['Night lamp', 'White', 2],
    ]);
  });
});
