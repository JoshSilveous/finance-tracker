import { useRef, useState } from 'react'

interface GridNavOptions {
	loopAtEnd?: boolean
}
export function useGridNav(navCols: string[], options?: GridNavOptions) {
	const endIndexRef = useRef<number | null>(null)
	const loopAtEnd = options !== undefined ? options.loopAtEnd : false

	const getCurNodeProperties = () => {
		const curElem = document.activeElement as HTMLElement
		const { grid_nav_col, grid_nav_index } = curElem.dataset
		if (grid_nav_col === undefined || grid_nav_index === undefined) {
			return null
		}

		if (!navCols.includes(grid_nav_col)) {
			throw new Error(
				`grid_nav_col "${grid_nav_col}" isn't defined in navCols provided to useGridNav()`
			)
		}
		if (endIndexRef.current === null) {
			throw new Error(`endIndex hasn't been set for useGridNav!`)
		}
		if (Number(grid_nav_index) > endIndexRef.current) {
			console.error('grid_nav_index on node is higher than endIndex:', curElem)
			throw new Error(`grid_nav_index on node is higher than endIndex`)
		}

		return { col: grid_nav_col, index: Number(grid_nav_index) }
	}

	const getNode = (col: string, index: number) => {
		const query = `[data-grid_nav_col="${col}"][data-grid_nav_index="${index}"]`
		const node = document.querySelector(query)
		return node as HTMLElement | null
	}

	const moveUp = () => {
		const curNode = getCurNodeProperties()
		if (curNode === null) {
			return
		}

		// search for next node and focus on it
		for (let i = curNode.index - 1; i >= 0; i--) {
			const nextNode = getNode(curNode.col, i)
			if (nextNode !== null) {
				nextNode.focus()
				return true
			}
		}

		if (loopAtEnd) {
			// if next node not found, start from the top
			for (let i = endIndexRef.current!; i >= 0; i--) {
				const nextNode = getNode(curNode.col, i)
				if (nextNode !== null) {
					nextNode.focus()
					return true
				}
			}
		}
		return false
	}
	const moveDown = () => {
		const curNode = getCurNodeProperties()
		if (curNode === null) {
			return
		}

		// search for next node and focus on it
		for (let i = curNode.index + 1; i <= endIndexRef.current!; i++) {
			const nextNode = getNode(curNode.col, i)
			if (nextNode !== null) {
				nextNode.focus()
				return true
			}
		}

		if (loopAtEnd) {
			// if next node not found, start from the top
			for (let i = 0; i < endIndexRef.current!; i++) {
				const nextNode = getNode(curNode.col, i)
				if (nextNode !== null) {
					nextNode.focus()
					return true
				}
			}
		}
		return false
	}
	// not needed, browser tab navigation is fine and I'm not going to use arrow keys
	// const moveLeft = () => {}
	// const moveRight = () => {}

	return {
		moveUp,
		moveDown,
		// moveLeft,
		// moveRight,
		setEndIndex: (index: number) => {
			endIndexRef.current = index
		},
	}
}
