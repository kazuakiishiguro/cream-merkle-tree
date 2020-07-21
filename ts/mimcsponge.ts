import * as circomlib from 'circomlib'
import * as snarkjs from 'snarkjs'

const mimcsponge = circomlib.mimcsponge
const bigInt = snarkjs.bigInt

// prime number for babyjubjub ec
const SNARK_FIELD_SIZE = bigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617'
)

type SnarkBigInt = snarkjs.bigInt

interface IHasher {
    hash: Function
}

class MimcSpongeHasher implements IHasher {
    public hash(
        left: SnarkBigInt,
        right: SnarkBigInt
    ): SnarkBigInt {
        return mimcsponge.multiHash([left, right], 0, 1)
    }
}

const hashOne = (
    preImage: SnarkBigInt
): SnarkBigInt => {
    return mimcsponge.multiHash([preImage], 0, 1)
}

export {
    bigInt,
    SnarkBigInt,
    SNARK_FIELD_SIZE,
    MimcSpongeHasher,
    hashOne
}

