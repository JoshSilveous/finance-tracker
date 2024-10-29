import { createPopup } from '../createPopup/createPopup'

export function promptError(errorMsg: string, instructions: string) {
	createPopup(
		<div>
			<h2>An unexpected error has occured.</h2>
			<h4>Error: "{errorMsg}"</h4>
			<p>
				Try refreshing the page. Eventually I'll put in better error handling
				instructions here :)
			</p>
		</div>,
		'error',
		() => {
			location.reload()
		}
	).trigger()
}
