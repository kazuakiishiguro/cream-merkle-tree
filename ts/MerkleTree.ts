import { SnarkBigInt, MimcSpongeHasher } from './mimcsponge'
import { PoseidonHasher } from './poseidon'

const mimcspongeHasher = new MimcSpongeHasher()
const poseidonHasher = new PoseidonHasher()

export type ChildLocation = 0 | 1   // 0 = left, 1 = right

export class MerkleTree {
	// tree depth
	public depth: number

	// constant zeroValue
	public zeroValue: SnarkBigInt

	// hash function
	public hashLeftRight: (left: SnarkBigInt, right: SnarkBigInt) => SnarkBigInt

	// the tree root
	public root: SnarkBigInt

	// the smallest empty leaf index
	public nextIndex: number

	// hash values of the leaves
	public leaves: SnarkBigInt[] = []

	// total number of leaves
	public leafNumber: number

	//cached values required to compute Merkle proofs
	public zeros: {[level: number]: SnarkBigInt}  // zero values of each level
	public filledSubtrees: {[level: number]: SnarkBigInt}  // values on most recent path from inserted value to root

	// partial tree w/ inserted values, hashes created from it and values used to created the hashes
	public filledPaths: {[level: number]: {[index: number]: SnarkBigInt}}

	constructor(
		_depth: number,
		_zero_value: SnarkBigInt,
		_hashLeftRight: (
			left: SnarkBigInt,
			right: SnarkBigInt
		) => SnarkBigInt = poseidonHasher.hash
	) {
		this.depth = _depth
		this.zeroValue = _zero_value
		this.hashLeftRight = _hashLeftRight
		this.nextIndex = 0
		this.zeros = { 0: this.zeroValue }
		this.filledSubtrees = { 0: this.zeroValue }
		this.filledPaths = { 0: {} }
		this.leafNumber = Math.pow(2, this.depth)

		// create initial merkletree with zero value
		// with given N levels and zeroValue
		for (let i = 1; i < _depth; i++) {
			this.zeros[i] = this.hashLeftRight(
				this.zeros[i - 1],
				this.zeros[i - 1]
			)
			this.filledSubtrees[i] = this.zeros[i]
			this.filledPaths[i] = {}
		}

		// compute the merkle root
		this.root = this.hashLeftRight(
			this.zeros[this.depth - 1],
			this.zeros[this.depth - 1]
		)
	}

	/*
	 * insert a leaf into the merkle tree
	 * @param _value the value to insert
	 */
	public insert(_value: SnarkBigInt) {
		if (this.nextIndex + 1 > this.leafNumber) {
			throw new Error('Merkle Tree at max capacity')
		}

		let curIdx = this.nextIndex
		this.nextIndex += 1

		let currentLevelHash = _value
		let left: SnarkBigInt
		let right: SnarkBigInt

		for (let i = 0; i < this.depth; i++) {
			if (curIdx % 2 === 0) {
				left = currentLevelHash
				right = this.zeros[i]

				this.filledSubtrees[i] = currentLevelHash
				this.filledPaths[i][curIdx] = left
				this.filledPaths[i][curIdx + 1] = right
			} else {
				left = this.filledSubtrees[i]
				right = currentLevelHash

				this.filledPaths[i][curIdx - 1] = left
				this.filledPaths[i][curIdx] = right
			}

			currentLevelHash = this.hashLeftRight(left, right)
			curIdx = Math.floor(curIdx / 2)
		}

		this.root = currentLevelHash
		this.leaves.push(_value)
	}

	/*
	 * update the leaf at the specified index with the given value
	 */
	public update(_leafIndex: number, _value: SnarkBigInt) {
		if (_leafIndex >= this.nextIndex) {
			throw new Error('The leaf index specified is too large')
		}

		let temp: SnarkBigInt[] = this.leaves
		temp[_leafIndex] = _value

		const newTree = new MerkleTree(this.depth, this.zeroValue)

		for (let i = 0; i < temp.length; i++) {
			newTree.insert(temp[i])
		}

		this.leaves = newTree.leaves
		this.zeros = newTree.zeros
		this.filledPaths = newTree.filledPaths
		this.filledSubtrees = newTree.filledSubtrees
		this.root = newTree.root
		this.nextIndex = newTree.nextIndex
	}

	/*
	 * returns the leaf value at the given index
	 */
	public getLeaf(_leafIndex: number | SnarkBigInt): SnarkBigInt {
		const leafIndex = parseInt(_leafIndex.toString(), 10)

		return this.leaves[leafIndex]
	}

	/*
	 * returns the path needed to construct a tree root
	 * used for quick verification on updates
	 * runs in O(log(N)), where N is the number of leaves
	 */
	public getPathUpdate(
		_leafIndex: number | SnarkBigInt
	): [SnarkBigInt[], ChildLocation[]] {
		const leafIndex = parseInt(_leafIndex.toString(), 10)
		if (leafIndex >= this.nextIndex) {
			throw new Error('Path not constructed yet, leafIndex >= nextIndex')
		}

		let curIdx = leafIndex
		let path: any[] = []
		let pathIndex: ChildLocation[] = []

		for (let i = 0; i < this.depth; i++) {
			if (curIdx % 2 === 0) {
				path.push(this.filledPaths[i][curIdx + 1])
				pathIndex.push(0)
			} else {
				path.push(this.filledPaths[i][curIdx - 1])
				pathIndex.push(1)
			}
			curIdx = Math.floor(curIdx / 2)
		}

		return [path, pathIndex]
	}
}
