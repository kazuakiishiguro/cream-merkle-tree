import * as crypto from 'crypto'
import { MimcSpongeHasher } from '../mimcsponge'
import { PoseidonHasher } from '../poseidon'
import { bigInt, SnarkBigInt, SNARK_FIELD_SIZE } from '../common'

const rbigInt = (nbytes: number): SnarkBigInt => {
	return bigInt.leBuff2int(crypto.randomBytes(nbytes))
}

describe('Hash functions', () => {
  describe('MiMC Sponge', () => {
    const hasher = new MimcSpongeHasher()

    it('should return correct hash', () => {
      const hash = hasher.hash(
        rbigInt(Math.floor(Math.random() * 1000)),
        rbigInt(Math.floor(Math.random() * 1000))
      )
      expect(hash.lt(SNARK_FIELD_SIZE)).toBeTruthy()
    })

    it('shoudl return correct hash from hashOne function', () => {
      const hash_one = hasher.hashOne(
        rbigInt(Math.floor(Math.random() * 1000))
      )
      expect(hash_one.lt(SNARK_FIELD_SIZE)).toBeTruthy()
    })
  })

  describe('Poseidon', () => {
    const hasher = new PoseidonHasher()

    it('should return correct hash', () => {
      const hash = hasher.hash(
        rbigInt(Math.floor(Math.random() * 1000)),
        rbigInt(Math.floor(Math.random() * 1000))
      )
      expect(hash.lt(SNARK_FIELD_SIZE)).toBeTruthy()
    })
  })
})
