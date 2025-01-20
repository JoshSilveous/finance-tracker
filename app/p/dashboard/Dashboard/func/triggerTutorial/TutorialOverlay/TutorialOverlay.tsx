import { useEffect, useRef, useState } from 'react'
import s from './TutorialOverlay.module.scss'
import { genStages, StageConfig } from './genStages'
import { isolateWindowListener, removeWindowListener, setWindowListener } from '@/utils'
import { JButton } from '@/components/JForm'

export const TRANSITION_TIME_MS = 300

export function TutorialOverlay({ close }: { close: () => void }) {
	const [currentStageIndex, setCurrentStageIndex] = useState(0)
	const prevStageIndexRef = useRef<number | null>(null)
	const [stages, setStages] = useState<StageConfig[]>(
		genStages(regenStages, prevStageIndexRef)
	)

	function regenStages() {
		setStages(genStages(regenStages, prevStageIndexRef))
	}

	useEffect(() => {}, [])

	useEffect(() => {
		if (prevStageIndexRef.current !== currentStageIndex) {
			if (stages[currentStageIndex].onSwitchedTo) {
				stages[currentStageIndex].onSwitchedTo()
			}
			if (
				prevStageIndexRef.current !== null &&
				stages[prevStageIndexRef.current].onSwitchedOff
			) {
				stages[prevStageIndexRef.current].onSwitchedOff!()
			}
		}
		prevStageIndexRef.current = currentStageIndex
		regenStages()
	}, [currentStageIndex])

	const containerRef = useRef<HTMLDivElement>(null)
	const backButtonRef = useRef<HTMLButtonElement>(null)
	const nextButtonRef = useRef<HTMLButtonElement>(null)
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

	const currentButtonRef = useRef<'back' | 'next'>('next')
	useEffect(() => {
		if (currentButtonRef.current === 'next') {
			nextButtonRef.current!.focus()
		} else {
			backButtonRef.current!.focus()
		}
	})

	const transitionStr = `top ${TRANSITION_TIME_MS}ms ease, left ${TRANSITION_TIME_MS}ms ease, width ${TRANSITION_TIME_MS}ms ease, height ${TRANSITION_TIME_MS}ms ease,
			border-radius ${TRANSITION_TIME_MS}ms ease`

	return (
		<div className={s.container} ref={containerRef}>
			<div
				className={s.cutout}
				style={{
					...stages[currentStageIndex].cutoutDimensions,
					transition: transitionStr,
				}}
			/>

			{stages[currentStageIndex].subHighlights !== undefined &&
				stages[currentStageIndex].subHighlights.map((highlight, index) => {
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
				style={{
					...stages[currentStageIndex].tipDimensions,
					transition: transitionStr,
				}}
			>
				<div className={s.tip_container}>
					<div className={s.progress_container}>
						{stages.map((_, index) => {
							if (index === 0) {
								return ''
							}
							return (
								<div
									key={index}
									className={`${s.circle} ${
										index <= currentStageIndex ? s.completed : ''
									}`}
								/>
							)
						})}
					</div>
					<div className={s.tip_content}>
						{stages[currentStageIndex].tipContent}
					</div>
					<div className={s.button_container}>
						<JButton
							jstyle='invisible'
							onClick={() => {
								if (currentStageIndex === 0) {
									close()
								} else {
									setCurrentStageIndex((p) => p - 1)
								}
							}}
							onFocus={() => (currentButtonRef.current = 'back')}
							ref={backButtonRef}
						>
							{currentStageIndex === 0 ? 'Exit' : 'Back'}
						</JButton>
						<JButton
							jstyle='invisible'
							onClick={() => {
								if (currentStageIndex === stages.length - 1) {
									close()
								} else {
									setCurrentStageIndex((p) => p + 1)
								}
							}}
							onFocus={() => (currentButtonRef.current = 'next')}
							ref={nextButtonRef}
						>
							{currentStageIndex === stages.length - 1 ? 'Exit' : 'Next'}
						</JButton>
					</div>
				</div>

				<div className={s.content_backdrop} />
			</div>
		</div>
	)
}
