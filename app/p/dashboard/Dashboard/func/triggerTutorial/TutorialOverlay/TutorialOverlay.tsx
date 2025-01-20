import { useEffect, useRef, useState } from 'react'
import s from './TutorialOverlay.module.scss'
import { genStages, StageName, Stages } from './genStages'
import { isolateWindowListener, removeWindowListener, setWindowListener } from '@/utils'
import { JButton } from '@/components/JForm'

export const TRANSITION_TIME_MS = 300

export function TutorialOverlay({ close }: { close: () => void }) {
	const stageNamesOrdered: StageName[] = [
		'transaction_manager_overview',
		'transaction_manager_reorder',
		'transaction_manager_fold',
		'transaction_manager_more_options',
		'options',
	]
	const containerRef = useRef<HTMLDivElement>(null)
	const backButtonRef = useRef<HTMLButtonElement>(null)
	const nextButtonRef = useRef<HTMLButtonElement>(null)
	const [currentStage, setCurrentStage] = useState<StageName>(stageNamesOrdered[0])
	const prevStageRef = useRef<StageName | null>(null)
	const [stages, setStages] = useState<Stages>(genStages(regenStages, prevStageRef))

	function regenStages() {
		setStages(genStages(regenStages, prevStageRef))
	}

	useEffect(() => {}, [])

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
		regenStages()
	}, [currentStage])

	useEffect(() => {
		const windowClickHandler = (event: MouseEvent) => {}
		const updateOnResize = () => {
			regenStages()
		}
		const handleFocus = (e: FocusEvent) => {
			if (e.target !== null && !containerRef.current!.contains(e.target as Node)) {
				nextButtonRef.current!.focus()
			}
		}
		setWindowListener('TUTORIAL_WINDOW_RESIZE', 'resize', updateOnResize)
		setWindowListener('TUTORIAL_CLICK_OVERRIDE', 'click', windowClickHandler)
		document.addEventListener('focusin', handleFocus)

		isolateWindowListener('TUTORIAL_CLICK_OVERRIDE')

		return () => {
			removeWindowListener('TUTORIAL_WINDOW_RESIZE')
			removeWindowListener('TUTORIAL_CLICK_OVERRIDE')
			document.removeEventListener('focusin', handleFocus)
		}
	}, [])

	const transitionStr = `top ${TRANSITION_TIME_MS}ms ease, left ${TRANSITION_TIME_MS}ms ease, width ${TRANSITION_TIME_MS}ms ease, height ${TRANSITION_TIME_MS}ms ease,
			border-radius ${TRANSITION_TIME_MS}ms ease`

	return (
		<div className={s.container} ref={containerRef}>
			<div
				className={s.cutout}
				style={{
					...stages[currentStage].cutoutDimensions,
					transition: transitionStr,
				}}
			/>

			{stages[currentStage].subHighlights !== undefined &&
				stages[currentStage].subHighlights.map((highlight, index) => {
					return (
						<div
							className={s.sub_highlight}
							key={index}
							style={{
								...highlight,
								transition: transitionStr,
							}}
						/>
					)
				})}

			<div
				className={s.content}
				style={{ ...stages[currentStage].tipDimensions, transition: transitionStr }}
			>
				<div className={s.tip_container}>
					<div className={s.tip_content}>{stages[currentStage].tipContent}</div>
					<div className={s.button_container}>
						<JButton
							jstyle='invisible'
							onClick={() =>
								setCurrentStage((p) => {
									const index = stageNamesOrdered.indexOf(p)
									return stageNamesOrdered[index - 1]
								})
							}
							disabled={currentStage === stageNamesOrdered[0]}
							ref={backButtonRef}
						>
							Back
						</JButton>
						<JButton
							jstyle='invisible'
							onClick={() =>
								setCurrentStage((p) => {
									const index = stageNamesOrdered.indexOf(p)
									return stageNamesOrdered[index + 1]
								})
							}
							disabled={
								currentStage ===
								stageNamesOrdered[stageNamesOrdered.length - 1]
							}
							ref={nextButtonRef}
						>
							Next
						</JButton>
					</div>
				</div>

				<div className={s.content_backdrop} />
			</div>
			<div className={s.devbuttons}>
				<button onClick={() => setCurrentStage('transaction_manager_overview')}>
					transaction_manager_overview
				</button>
				<button onClick={() => setCurrentStage('transaction_manager_reorder')}>
					transaction_manager_reorder
				</button>
				<button onClick={() => setCurrentStage('transaction_manager_fold')}>
					transaction_manager_fold
				</button>
				<button onClick={() => setCurrentStage('transaction_manager_more_options')}>
					transaction_manager_more_options
				</button>
				<button onClick={() => setCurrentStage('options')}>options</button>
				<button onClick={close}>Close me!</button>
			</div>
		</div>
	)
}
