export interface Hasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

export class BunHasher implements Hasher {
  constructor(
    private memoryCost: number = 19456,
    private timeCost: number = 2
  ) {}

  async hash(password: string): Promise<string> {
    return await Bun.password.hash(password, {
      algorithm: 'argon2id',
      memoryCost: this.memoryCost,
      timeCost: this.timeCost,
    });
  }

  async verify(password: string, hash: string): Promise<boolean> {
    try {
      return await Bun.password.verify(password, hash);
    } catch {
      return false;
    }
  }
}
