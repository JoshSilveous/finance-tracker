import ReactDOM from 'react-dom/client'
import s from './blockOnMobile.module.scss'

/**
 * Inserts a DOM node that blocks the display with a message on mobile
 */
export function blockOnMobile() {
	const alreadyInDom = document.querySelector(`.${s.container}`) !== null
	console.log('running!', alreadyInDom, document.querySelector(`.${s.container}`))
	if (!alreadyInDom) {
		const body = document.body
		const container = document.createElement('div')
		container.classList.add(s.container)
		body.appendChild(container)
		const domLocation = ReactDOM.createRoot(container)
		const content = (
			<div className={s.main}>
				<p>
					This content isn&apos;t optimized for mobile yet- please visit this site
					on a desktop.
				</p>
			</div>
		)
		domLocation.render(content)
	}
}
