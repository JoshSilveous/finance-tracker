'use client'

/**
 * Returns the width of the client's scrollbar (by injecting an invisible div then removing it)
 */
export function getScrollbarWidth() {
	// Create a temporary div element
	const tempDiv = document.createElement('div')

	// Apply styles to make the div invisible and scrollable
	tempDiv.style.position = 'absolute'
	tempDiv.style.top = '-9999px'
	tempDiv.style.width = '100px'
	tempDiv.style.height = '100px'
	tempDiv.style.overflow = 'scroll'

	// Append the div to the body
	document.body.appendChild(tempDiv)

	// Calculate the scrollbar width
	const scrollbarWidth = tempDiv.offsetWidth - tempDiv.clientWidth

	// Remove the div from the body
	document.body.removeChild(tempDiv)

	// Return the scrollbar width
	return scrollbarWidth
}
