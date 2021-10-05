describe('Morebits.ip', () => {
	test('sanitizeIPv6', () => {
		assert.strictEqual(Morebits.ip.sanitizeIPv6('2001:0db8:0010:0000:0000:0000:0000:0001'), '2001:DB8:10:0:0:0:0:1', 'Shorten IPv6');
		assert.strictEqual(Morebits.ip.sanitizeIPv6('2001:0db8:0010::1'), '2001:DB8:10:0:0:0:0:1', 'Condensed form');
		assert.strictEqual(Morebits.ip.sanitizeIPv6('2001:0db8:0010:0000:0000:0000:0000:0001/42'), '2001:DB8:10:0:0:0:0:1/42', 'Subnet');
		assert.strictEqual(Morebits.ip.sanitizeIPv6('192.0.2.0'), '192.0.2.0', 'IPv4');
		assert.strictEqual(Morebits.ip.sanitizeIPv6('Syenite'), 'Syenite', 'Username');
	});
	test('isRange', () => {
		assert.true(Morebits.ip.isRange('192.0.2.0/24'), 'IPv4 range');
		assert.true(Morebits.ip.isRange('2001:DB8:10:0:0:0:0:1/42'), 'IPv6 range');
		assert.true(Morebits.ip.isRange('2001:DB8:0010::1/42'), 'IPv6 range condensed');
		assert.false(Morebits.ip.isRange('192.0.2.0'), 'IPv4 single IP');
		assert.false(Morebits.ip.isRange('2001:DB8:10:0:0:0:0:1'), 'IPv6 single IP');
		assert.false(Morebits.ip.isRange('Damaya'), 'Username');
	});
	test('validCIDR', () => {
		assert.true(Morebits.ip.validCIDR('192.0.2.0/24'), 'IPv4 range');
		assert.true(Morebits.ip.validCIDR('2001:DB8:10:0:0:0:0:1/42'), 'IPv6 range');
		assert.true(Morebits.ip.validCIDR('2001:DB8:0010::1/42'), 'IPv6 range condensed');
		assert.false(Morebits.ip.validCIDR('192.0.2.0'), 'IPv4 single IP');
		assert.false(Morebits.ip.validCIDR('2001:DB8:10:0:0:0:0:1'), 'IPv6 single IP');
		assert.false(Morebits.ip.validCIDR('Essun'), 'Username');
		assert.false(Morebits.ip.validCIDR('192.0.2.0/15'), 'IPv4 range too large');
		assert.false(Morebits.ip.validCIDR('2001:DB8:10:0:0:0:0:1/31'), 'IPv6 range too large');
	});
	test('get64', () => {
		assert.strictEqual(Morebits.ip.get64('2001:DB8:10:0:0:0:0:1'), '2001:DB8:10:0:0:0:0:0/64', 'IPv6');
		assert.strictEqual(Morebits.ip.get64('2001:DB8:10:0:0:0:0:1/65'), '2001:DB8:10:0:0:0:0:0/64', '65 subnet');
		assert.strictEqual(Morebits.ip.get64('2001:DB8:10:0:0:0:0:1/64'), '2001:DB8:10:0:0:0:0:0/64', '64 subnet');
		assert.false(Morebits.ip.get64('2001:DB8:10:0:0:0:0:1/63'), '63 subnet');
		assert.false(Morebits.ip.get64(), 'Missing');
		assert.false(Morebits.ip.get64('192.0.2.0'), 'IPv4');
	});
});
