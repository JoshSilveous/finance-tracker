import { useEffect, useRef, useState } from 'react'
import s from './TutorialOverlay.module.scss'
import { genStages, StageName, Stages } from './genStages'
import { isolateWindowListener, removeWindowListener, setWindowListener } from '@/utils'

export const TRANSITION_TIME_MS = 300

export function TutorialOverlay({ close }: { close: () => void }) {
	const [currentStage, setCurrentStage] = useState<StageName>('options')
	const prevStageRef = useRef<StageName | null>(null)
	const [stages, setStages] = useState<Stages>(genStages())

	useEffect(() => {
		const updateOnResize = () => {
			console.log('resized! recalculating')
			setStages(genStages())
		}
		setWindowListener('TUTORIAL_WINDOW_RESIZE', 'resize', updateOnResize)

		return () => removeWindowListener('TUTORIAL_WINDOW_RESIZE')
	}, [])

	useEffect(() => {
		if (prevStageRef.current !== currentStage) {
			if (stages[currentStage].onSwitchedTo) {
				stages[currentStage].onSwitchedTo()
			}
			if (
				prevStageRef.current !== null &&
				stages[prevStageRef.current].onSwitchedOff
			) {
				stages[prevStageRef.current].onSwitchedOff!()
			}
		}
		prevStageRef.current = currentStage
	}, [currentStage])

	useEffect(() => {
		const windowClickHandler = (event: MouseEvent) => {}
		setWindowListener('TUTORIAL_CLICK_OVERRIDE', 'click', windowClickHandler)
		isolateWindowListener('TUTORIAL_CLICK_OVERRIDE')

		return () => removeWindowListener('TUTORIAL_CLICK_OVERRIDE')
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
			>
				<div className={s.tip_container}>{stages[currentStage].tipContent}</div>
				<div className={s.content_backdrop} />
			</div>
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
