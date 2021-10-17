export const bigInt = require('./bigInt')

// prime number for babyjubjub ec
export const SNARK_FIELD_SIZE = bigInt(
	'21888242871839275222246405745257275088548364400416034343698204186575808495617'
)

export type SnarkBigInt = typeof bigInt