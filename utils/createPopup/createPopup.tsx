'use client'
import React from 'react'
import ReactDOM from 'react-dom/client'
import s from './createPopup.module.scss'

// const popupDomLocation = ReactDOM.createRoot(
// 	document.getElementById('popup-root') as HTMLDivElement
// )

/**
 * Creates a blocking popup on the screen. Overrides other popups.
 * @param content The JSX content to hold within the popup.
 * @param handleClose A callback function that is ran when the popup is closed by the user pressing the `x` button (not when closed via `this.close()`).
 * @returns an object containing the `trigger()` and `close()` functions
 */
export function createPopup(
	content: JSX.Element,
	type: 'normal' | 'error' = 'normal',
	handleClose?: () => void
) {
	const body = document.body
	const popupContainer = document.createElement('div')

	body.appendChild(popupContainer)
	const popupDomLocation = ReactDOM.createRoot(popupContainer)

	return {
		trigger() {
			popupDomLocation.render(
				<div className={`${s.popup_background} ${s[type]}`}>
					<div className={s.popup_container}>
						<div
							className={s.popup_exit}
							onClick={() => {
								this.close()
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
		},
		close() {
			popupDomLocation.render(<></>)
			popupDomLocation.unmount()
			popupContainer.remove()
		},
	}
}
