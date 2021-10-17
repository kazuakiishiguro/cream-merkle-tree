import * as circomlib from 'circomlib'
import { SnarkBigInt } from './common'

const mimcsponge = circomlib.mimcsponge

interface IHasher {
	hash: Function
}

class MimcSpongeHasher implements IHasher {
	public hash(left: SnarkBigInt, right: SnarkBigInt): SnarkBigInt {
		return mimcsponge.multiHash([left, right], 0, 1)
	}

	public hashOne(preImage: SnarkBigInt): SnarkBigInt {
		return mimcsponge.multiHash([preImage], 0, 1)
	}
}

export { SnarkBigInt, MimcSpongeHasher }
