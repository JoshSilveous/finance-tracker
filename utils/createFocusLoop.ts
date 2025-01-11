'use client'

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
		const onFirstNodeKeydown = (e: KeyboardEvent) => {
			if (e.key === 'Tab' && e.shiftKey) {
				e.preventDefault()
				if (lastNode) {
					lastNode.focus()
				}
			}
		}
		const onLastNodeKeydown = (e: KeyboardEvent) => {
			if (e.key === 'Tab' && !e.shiftKey) {
				e.preventDefault()
				if (firstNode) {
					firstNode.focus()
				}
			}
		}
		firstNode.addEventListener('keydown', onFirstNodeKeydown)
		firstNode.dataset['focus_loop_first_node_applied'] = 'true'
		lastNode.addEventListener('keydown', onLastNodeKeydown)
		lastNode.dataset['focus_loop_first_node_applied'] = 'true'
	}
}
