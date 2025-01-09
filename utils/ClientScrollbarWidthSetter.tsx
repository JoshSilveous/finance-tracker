'use client'

import { useEffect } from 'react'

export function setScrollbarWidths() {
	// Create a temporary div element for calculating regular scrollbar width
	const regularDiv = document.createElement('div')
	regularDiv.style.position = 'absolute'
	regularDiv.style.top = '-9999px'
	regularDiv.style.width = '100px'
	regularDiv.style.height = '100px'
	regularDiv.style.overflow = 'scroll'

	// Append the div to the body and calculate regular scrollbar width
	document.body.appendChild(regularDiv)
	const regularScrollbarWidth = regularDiv.offsetWidth - regularDiv.clientWidth
	document.body.removeChild(regularDiv)

	// Create a temporary div element for calculating thin scrollbar width
	const thinDiv = document.createElement('div')
	thinDiv.style.position = 'absolute'
	thinDiv.style.top = '-9999px'
	thinDiv.style.width = '100px'
	thinDiv.style.height = '100px'
	thinDiv.style.overflow = 'scroll'
	thinDiv.style.scrollbarWidth = 'thin'

	// Append the div to the body and calculate thin scrollbar width
	document.body.appendChild(thinDiv)
	const thinScrollbarWidth = thinDiv.offsetWidth - thinDiv.clientWidth
	document.body.removeChild(thinDiv)

	// Set the CSS variables on the document's body
	document.body.style.setProperty('--scrollbar-width', `${regularScrollbarWidth}px`)
	document.body.style.setProperty('--scrollbar-width-thin', `${thinScrollbarWidth}px`)
}

/**
 * **THIS COMPONENT DOESN'T RENDER ANYTHING** and is only utility.
 *
 * Calculates the scrollbar widths, regular and thin, and appends them to the document's body as CSS variables `--scrollbar-width` and `--scrollbar-width-thin`
 *
 * These variables are used throughout the application to embed scrollbars within padding in a cross-browser compatible way.
 *
 */
export function ClientScrollbarWidthSetter() {
	useEffect(() => {
		setScrollbarWidths()
	}, [])
	return <></>
}
