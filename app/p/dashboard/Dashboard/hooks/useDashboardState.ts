/**
 * TestState1
 */
interface TestState1 {
	/**
	 * Foo!
	 */
	foo: string
}

const test1: TestParent['child'] = {
	foo: 'bar',
}

/**
 * TestParent!
 */
interface TestParent {
	/**
	 * Child!
	 * @see {@linkcode TestState1}
	 */
	child: TestState1
}

const testParent: TestParent = {
	child: test1,
}

testParent.child.foo

/**
 * So, I can extract types from the parent definition pretty easily.
 */
