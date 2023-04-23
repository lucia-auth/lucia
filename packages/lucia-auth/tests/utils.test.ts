import { assert, expect, test, populateGlobal } from 'vitest';
import { generateHashWithScrypt, validateScryptHash } from '../src/utils/crypto';

test('valiateScryptHash validates a known hash', async () => {
  const hash = 's2:wbaKghr7zyp9F3fx:6c1ed6b31cc60d82777ba848183c88cb77e127d666a48262f2d59b1f85aa9cccbe9ea35d1925d20eed1172425f983592302102c04999a44325a73ddf1f4a833e';
  const validation = await validateScryptHash('password', hash);
  expect(validation).toBe(true);
})
