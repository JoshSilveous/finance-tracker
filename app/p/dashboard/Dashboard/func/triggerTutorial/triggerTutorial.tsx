import s from './triggerTutorial.module.scss'
import { createPopup, delay } from '@/utils'
import transactionManagerStyles from '../../tiles/TransactionManager/TransactionManager.module.scss'
import ReactDOM from 'react-dom/client'
import { TutorialOverlay } from './TutorialOverlay/TutorialOverlay'

export function triggerTutorial() {
	const body = document.body
	const tutorialContainer = document.createElement('div')

	body.appendChild(tutorialContainer)
	const tutorialReactRoot = ReactDOM.createRoot(tutorialContainer)

	tutorialReactRoot.render(
		<TutorialOverlay
			close={() => {
				tutorialReactRoot.render(<></>)
				tutorialReactRoot.unmount()
				tutorialContainer.remove()
			}}
		/>
	)
}
