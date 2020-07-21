import * as crypto from 'crypto'
import { bigInt, SnarkBigInt } from './mimcsponge'

const rbigInt = (
    nbytes: number
): SnarkBigInt => {
    return bigInt.leBuff2int(crypto.randomBytes(nbytes))
}

export {
    rbigInt
}


