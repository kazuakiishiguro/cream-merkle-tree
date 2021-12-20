import { MerkleTree } from '../MerkleTree'
import { bigInt, SnarkBigInt } from '../mimcsponge'
import { PoseidonHasher } from '../poseidon'

const DEPTH = 2
const ZERO_VALUE = bigInt(0)

const hasher = new PoseidonHasher()

/*
 * Calculate a merkle root given a list of leaves
 */
const calculateRoot = (
	unhashedLeaves: SnarkBigInt[],
	tree: MerkleTree
): SnarkBigInt => {
	const totalLeaves = 2 ** DEPTH
	const numLeafHashers = totalLeaves / 2
	const numInterMediateHashers = numLeafHashers - 1

	const hashes: SnarkBigInt[] = []

	for (let i = 0; i < numLeafHashers; i++) {
		hashes.push(
			tree.hashLeftRight(
				hasher.hashOne(unhashedLeaves[i * 2]),
				hasher.hashOne(unhashedLeaves[i * 2 + 1])
			)
		)
	}

	let k = 0
	for (
		let i = numLeafHashers;
		i < numLeafHashers + numInterMediateHashers;
		i++
	) {
		hashes.push(tree.hashLeftRight(hashes[k * 2], hashes[k * 2 + 1]))
		k++
	}

	return hashes[hashes.length - 1]
}

describe('MerkleTree', () => {
	const tree = new MerkleTree(DEPTH, ZERO_VALUE)

	it('should initialize correctly', () => {
		const INITIAL_ROOT = bigInt(
			'7423237065226347324353380772367382631490014989348495481811164164159255474657'
		)

		const tree2 = new MerkleTree(DEPTH, ZERO_VALUE)
		const tree3 = new MerkleTree(DEPTH, bigInt(1))

		expect(tree.depth.toString()).toEqual(DEPTH.toString())
		expect(tree.zeroValue.toString()).toEqual(ZERO_VALUE.toString())
		expect(INITIAL_ROOT.toString()).toEqual(tree.root.toString())
		expect(tree).toEqual(tree2)
		expect(tree).not.toEqual(tree3)
	})

	it('should return correct root hash', () => {
		const leaves: SnarkBigInt[] = []

		for (let i = 0; i < 2 ** DEPTH; i++) {
			const leaf = bigInt(i + 1)
			leaves.push(leaf)
			tree.insert(hasher.hashOne(leaf))
		}

		expect(calculateRoot(leaves, tree).toString()).toEqual(
			tree.root.toString()
		)
	})

	it('should update corrrectly', () => {
		const tree1 = new MerkleTree(DEPTH, ZERO_VALUE)
		const tree2 = new MerkleTree(DEPTH, ZERO_VALUE)

		for (let i = 0; i < 2 ** DEPTH; i++) {
			tree1.insert(hasher.hashOne(i + 1))
			tree2.insert(hasher.hashOne(i + 1))
		}

		expect(tree1.root.toString()).toEqual(tree2.root.toString())

		const indexToUpdate = 1
		const newVal = hasher.hashOne(bigInt(4))
		tree1.update(indexToUpdate, newVal)

		expect(tree1.root).not.toEqual(tree2.root)

		const tree3 = new MerkleTree(DEPTH, ZERO_VALUE)

		for (let leaf of tree1.leaves) {
			tree3.insert(leaf)
		}

		expect(tree1.root).toEqual(tree3.root)
		expect(tree3.getLeaf(indexToUpdate).toString()).toEqual(
			newVal.toString()
		)
	})
})
