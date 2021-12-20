import { SnarkBigInt } from './mimcsponge'
import { PoseidonHasher } from './poseidon'

const poseidonHasher = new PoseidonHasher()

export type ChildLocation = 0 | 1   // 0 = left, 1 = right

// Merkle tree implementation that sparsely represents a tree at each level.
// The tree data strucutre is originally empty. As a leaf is added at the bottom level, 
// above that level up to root, only parent nodes are added to the data structure.
//
// At each level, when a LHS node is newly added, the value is cached in order to  
// calculate the parent hash next time w/ the newly coming RHS node
//
// Below example shows how the data structure represents the tree. 
// '.' means empty and a number means filled.
//
// 1. Initially the tree is empty 
//        .
//      .   .
//     . . . .
//
// 2. A leaf is added. The data structure contains 3 nodes. 2 and 3 are cached.
//        1
//      2   .
//     3 . . .
//
// 3. Another leaf is added. The data structure contain 4 nodes. To recalculate 2, cached 3 was used.
//        1
//      2   .
//     3 4 . .
//
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

	// zero values that are pre-calculted at each level 
	public zeros: {[level: number]: SnarkBigInt}

	// cache of most recently added LHS child at each level
	public lastCalculatedNodeValueAtLevel: {[level: number]: SnarkBigInt} 

	// filled nodes so far at each level. each level is represented 
	// as an array of hashes filled from left to  eight
	public filledNodesAtLevel: {[level: number]: {[index: number]: SnarkBigInt}}

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
		this.lastCalculatedNodeValueAtLevel = { 0: this.zeroValue }
		this.filledNodesAtLevel = { 0: {} }
		this.leafNumber = Math.pow(2, this.depth)

		// create empty merkletree using given zero value at leaf level
		for (let i = 1; i < _depth; i++) {
			this.zeros[i] = this.hashLeftRight(
				this.zeros[i - 1],
				this.zeros[i - 1]
			)
			this.lastCalculatedNodeValueAtLevel[i] = this.zeros[i]
			this.filledNodesAtLevel[i] = {}
		}

		// compute the merkle root
		this.root = this.hashLeftRight(
			this.zeros[this.depth - 1],
			this.zeros[this.depth - 1]
		)
	}

	/*
	 * Insert a new leaf into the tree
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

				this.lastCalculatedNodeValueAtLevel[i] = currentLevelHash
				this.filledNodesAtLevel[i][curIdx] = left
				this.filledNodesAtLevel[i][curIdx + 1] = right
			} else {
				left = this.lastCalculatedNodeValueAtLevel[i]
				right = currentLevelHash

				this.filledNodesAtLevel[i][curIdx - 1] = left
				this.filledNodesAtLevel[i][curIdx] = right
			}

			currentLevelHash = this.hashLeftRight(left, right)
			curIdx = Math.floor(curIdx / 2)
		}

		this.root = currentLevelHash
		this.leaves.push(_value)
	}

	/*
	 * Changes the leaf at the specified index and updates the tree
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
		this.filledNodesAtLevel = newTree.filledNodesAtLevel
		this.lastCalculatedNodeValueAtLevel = newTree.lastCalculatedNodeValueAtLevel
		this.root = newTree.root
		this.nextIndex = newTree.nextIndex
	}

	/*
	 * Returns the leaf value at the given index
	 */
	public getLeaf(_leafIndex: number | SnarkBigInt): SnarkBigInt {
		const leafIndex = parseInt(_leafIndex.toString(), 10)

		return this.leaves[leafIndex]
	}

	/*
	 * Returns the path needed to construct a tree root where the path is 
	 * represented by 2 lists.
	 * One is a list of counterparts at each level to calculate the hash 
	 * of the parent, and the other is a list of child indices where child 
	 * index is 0 or 1, representing LHS and RHS child respentively.
	 * 
	 * Used for quick verification on updates
	 * Runs in O(log(N)), where N is the number of leaves
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
				path.push(this.filledNodesAtLevel[i][curIdx + 1])
				pathIndex.push(0)
			} else {
				path.push(this.filledNodesAtLevel[i][curIdx - 1])
				pathIndex.push(1)
			}
			curIdx = Math.floor(curIdx / 2)
		}

		return [path, pathIndex]
	}
}
