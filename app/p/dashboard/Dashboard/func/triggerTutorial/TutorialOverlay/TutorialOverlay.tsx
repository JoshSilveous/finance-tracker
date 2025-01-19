import { useEffect, useState } from 'react'
import s from './TutorialOverlay.module.scss'
import { genStages, StageName, Stages } from './genStages'
import { isolateWindowListener, removeWindowListener, setWindowListener } from '@/utils'

export const TRANSITION_TIME_MS = 300

export function TutorialOverlay({ close }: { close: () => void }) {
	const [currentStage, setCurrentStage] = useState<StageName>('options')
	const [stages, setStages] = useState<Stages>(genStages())

	useEffect(() => {
		const updateOnResize = () => {
			console.log('resized! recalculating')
			setStages(genStages())
		}
		window.addEventListener('resize', updateOnResize)

		return () => window.removeEventListener('resize', updateOnResize)
	}, [])

	useEffect(() => {
		if (stages[currentStage].onSwitchedTo) {
			stages[currentStage].onSwitchedTo()
		}
	}, [currentStage])

	useEffect(() => {
		const windowClickHandler = (event: MouseEvent) => {
			console.log('stopping propagation')
		}
		setWindowListener('TUTORIAL_OVERLAY', 'click', windowClickHandler)
		isolateWindowListener('TUTORIAL_OVERLAY')

		return () => removeWindowListener('TUTORIAL_OVERLAY')
	}, [])

	const transitionStr = `top ${TRANSITION_TIME_MS}ms ease, left ${TRANSITION_TIME_MS}ms ease, width ${TRANSITION_TIME_MS}ms ease, height ${TRANSITION_TIME_MS}ms ease,
			border-radius ${TRANSITION_TIME_MS}ms ease`

	return (
		<div className={s.container}>
			<div
				className={s.cutout}
				style={{
					...stages[currentStage].cutoutDimensions,
					transition: transitionStr,
				}}
			></div>
			<div
				className={s.content}
				style={{ ...stages[currentStage].tipDimentions, transition: transitionStr }}
			></div>
			<div className={s.devbuttons}>
				<button onClick={() => setCurrentStage('transaction_manager')}>
					transaction_manager
				</button>
				<button onClick={() => setCurrentStage('options')}>options</button>
				<button onClick={close}>Close me!</button>
			</div>
		</div>
	)
}
