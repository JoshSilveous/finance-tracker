'use client'
import React from 'react'
import ReactDOM from 'react-dom/client'
import s from './createPopup.module.scss'

/**
 * Creates a blocking popup on the screen. Overrides other popups.
 * @param content The JSX content to hold within the popup.
 * @param handleClose A callback function that is ran when the popup is closed by the user pressing the `x` button (not when closed via `this.close()`).
 * @returns an object containing the `trigger()` and `close()` functions
 */
export interface PopupConfig {
	/**
	 * The JSX content to hold within the popup.
	 */
	content: JSX.Element
	/**
	 * Affects the styling of the popup. Default is `'normal'`.
	 */
	type?: 'normal' | 'error'
	/**
	 * Hide the top-right exit button.
	 */
	hideExitButton?: boolean
	/**
	 * Runs when the top-right exit button is used to close the popup
	 */
	handleClose?: () => void
}

export function createPopup({
	content,
	type = 'normal',
	hideExitButton,
	handleClose,
}: PopupConfig) {
	const body = document.body
	const popupContainer = document.createElement('div')

	body.appendChild(popupContainer)
	const popupDomLocation = ReactDOM.createRoot(popupContainer)

	const onUndoOrRedo = () => {
		popupDomLocation.render(<></>)
		popupDomLocation.unmount()
		popupContainer.remove()
		window.removeEventListener('popstate', onUndoOrRedo)
	}

	return {
		trigger() {
			window.addEventListener('popstate', onUndoOrRedo)
			popupDomLocation.render(
				<div className={`${s.popup_background} ${s[type]}`}>
					<div
						className={`${s.popup_container} ${
							hideExitButton ? s.exit_hidden : ''
						}`}
					>
						{!hideExitButton && (
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
						)}

						{content}
					</div>
				</div>
			)
		},
		close() {
			popupDomLocation.render(<></>)
			popupDomLocation.unmount()
			popupContainer.remove()
			window.removeEventListener('popstate', onUndoOrRedo)
		},
	}
}
