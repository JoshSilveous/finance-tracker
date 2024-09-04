'use client'
import React from 'react'
import ReactDOM from 'react-dom/client'
import s from './triggerPopup.module.scss'

// const popupDomLocation = ReactDOM.createRoot(
// 	document.getElementById('popup-root') as HTMLDivElement
// )

/**
 * Creates a blocking popup on the screen. Overrides other popups.
 * @param content The content to hold within the popup.
 * @param handleClose A callback function that is ran when the popup is closed by the user pressing the `x` button.
 * @param specialType `"warning"` will make the popup tinted red.
 */
export function triggerPopup(content: JSX.Element, handleClose?: () => void) {
	const body = document.body
	const newPopupDiv = document.createElement('div')
	body.appendChild(newPopupDiv)
	console.log('newPopupDiv', newPopupDiv)
	const popupDomLocation = ReactDOM.createRoot(newPopupDiv)
	const popupFinal = (
		<div className={s.popup_background}>
			<div className={s.popup_container}>
				<div
					className={s.popup_exit}
					onClick={() => {
						closePopup()
						if (handleClose) {
							handleClose()
						}
					}}
				>
					✖
				</div>
				{content}
			</div>
		</div>
	)
	/**
	 * Closes the current popup.
	 */
	function closePopup() {
		popupDomLocation.render(<></>)
	}

	popupDomLocation.render(popupFinal)
}

export function createPopup() {
	let x = 1
	function incrementX() {
		x++
	}
	function returnX() {
		return x
	}
	return { incrementX, returnX }
}
