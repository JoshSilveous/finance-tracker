import { createPopup } from '../createPopup/createPopup'

export function createErrorPopup(error: string) {
	createPopup(
		<div>
			<h2>An unexpected error has occured.</h2>
			<h4>Error: "{error}"</h4>
			<p>
				Try refreshing the page. Eventually I'll put in better error handling
				instructions here :)
			</p>
		</div>
	).trigger()
}
