'use client'

const clearFocusLoopBuffer: { node: HTMLElement; clear: () => void }[] = []

/**
 * Creates a focus loop that will restrict `tab` navigation between two nodes.
 * @param firstNode The first node in the loop
 * @param lastNode The last node in the loop
 */
export function createFocusLoop(firstNode: HTMLElement, lastNode: HTMLElement) {
	if (
		firstNode.dataset['focus_loop_first_node_applied'] !== 'true' ||
		lastNode.dataset['focus_loop_first_node_applied'] !== 'true'
	) {
		// console.log('firstNode:', firstNode, 'lastNode:', lastNode)
		const onFirstNodeKeydown = (e: KeyboardEvent) => {
			if (e.key === 'Tab' && e.shiftKey) {
				e.preventDefault()
				// console.log('should focus on lastnode')
				if (lastNode) {
					// console.log('success')
					lastNode.focus()
				}
			}
		}
		const onLastNodeKeydown = (e: KeyboardEvent) => {
			if (e.key === 'Tab' && !e.shiftKey) {
				e.preventDefault()
				// console.log('should focus on firstnode')
				if (firstNode) {
					// console.log('success')
					firstNode.focus()
				}
			}
		}
		firstNode.addEventListener('keydown', onFirstNodeKeydown)
		firstNode.dataset['focus_loop_first_node_applied'] = 'true'
		lastNode.addEventListener('keydown', onLastNodeKeydown)
		lastNode.dataset['focus_loop_first_node_applied'] = 'true'
		clearFocusLoopBuffer.push(
			{
				node: firstNode,
				clear: () => firstNode.removeEventListener('keydown', onFirstNodeKeydown),
			},
			{
				node: lastNode,
				clear: () => firstNode.removeEventListener('keydown', onLastNodeKeydown),
			}
		)
	}
}

/**
 * Clears the focus loop events from provided nodes
 * @param nodes Nodes to clear
 */
export function clearFocusLoop(...nodes: HTMLElement[]) {
	nodes.forEach((node) => {
		// console.log('clearing listener for', node)
		const index = clearFocusLoopBuffer.findIndex((focusLoop) => focusLoop.node === node)
		if (index !== -1) {
			node.dataset['focus_loop_first_node_applied'] = undefined
			clearFocusLoopBuffer[index].clear()
			clearFocusLoopBuffer.splice(index, 1)
		}
	})
}
