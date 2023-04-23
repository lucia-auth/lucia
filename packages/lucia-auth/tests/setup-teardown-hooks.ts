// setup-teardown-hook.js
import { afterAll, beforeAll } from 'vitest';
import crypto from "crypto";

beforeAll(() => {
  global.crypto = crypto;
});
afterAll(() => {
  delete global.lol
});
