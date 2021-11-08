import * as circomlib from 'circomlib'

const bigInt = require('./bigInt')

type SnarkBigInt = typeof bigInt

interface IHasher {
	hash: (left: SnarkBigInt, right: SnarkBigInt) => SnarkBigInt
}

class PoseidonHasher implements IHasher {
	public hash(left: SnarkBigInt, right: SnarkBigInt): SnarkBigInt {
		return circomlib.poseidon([left, right])
	}

	public hashOne(preImage: SnarkBigInt): SnarkBigInt {
		return circomlib.poseidon([preImage, preImage])
	}
}

export { PoseidonHasher }
