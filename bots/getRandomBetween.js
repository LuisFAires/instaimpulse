import crypto from 'crypto';

export default function getRandomBetween(min, max) {
  return crypto.randomInt(min, max + 1);
}