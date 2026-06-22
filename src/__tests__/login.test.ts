describe('Login route regex escaping', () => {
  const escapeRegex = (input: string) => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  it('should escape regex special characters in user input', () => {
    const maliciousInputs = [
      'admin.*',
      'user$',
      'test(abc)',
      'name[0]',
      'foo{bar}',
      'a|b',
      'x+y',
      '^admin$',
    ];

    maliciousInputs.forEach((input) => {
      const escaped = escapeRegex(input);
      // Every character in the escaped string that is a regex metachar
      // must be preceded by a backslash
      for (let i = 0; i < escaped.length; i++) {
        const ch = escaped[i];
        if (ch === '\\' && i + 1 < escaped.length) {
          i++; // skip escaped char
          continue;
        }
        if ('.+*?^${}()|[]\\'.includes(ch)) {
          throw new Error(`Unescaped "${ch}" at index ${i} in "${escaped}" (original: "${input}")`);
        }
      }
    });
  });

  it('should produce exact match regex for normal input', () => {
    const escaped = escapeRegex('somak_fan');
    expect(escaped).toBe('somak_fan');
  });

  it('should escape dots properly', () => {
    const escaped = escapeRegex('user.name');
    expect(escaped).toBe('user\\.name');
  });

  it('should escape parentheses properly', () => {
    const escaped = escapeRegex('test(user)');
    expect(escaped).toBe('test\\(user\\)');
  });
});
