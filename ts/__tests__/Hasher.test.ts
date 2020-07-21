import { bigInt, SNARK_FIELD_SIZE, hashOne, MimcSpongeHasher } from '../mimcsponge'
import { rbigInt } from '../utils'

describe('Hash functions', () => {
    const hasher = new MimcSpongeHasher()

    it('should return correct hash', () => {
        const hash = hasher.hash(rbigInt(Math.floor(Math.random() * 1000)), rbigInt(Math.floor(Math.random() * 1000)))
        expect(hash.lt(SNARK_FIELD_SIZE)).toBeTruthy()
    })

    it('shoudl return correct hash from hashOne function', () => {
        const hash_one = hashOne(rbigInt(Math.floor(Math.random() * 1000)))
        expect(hash_one.lt(SNARK_FIELD_SIZE)).toBeTruthy()
    })
})

