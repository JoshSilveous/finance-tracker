import { useState } from 'react'
import s from './TutorialPopup.module.scss'
import { CategoryItem } from './TutorialCategoryEditor/TutorialCategoryEditor'
import { genStages } from './genStages/genStages'
import { AccountItem } from './TutorialAccountEditor/TutorialAccountEditor'
export function TutorialPopup({ startingStage }: { startingStage: number }) {
	const [currentStage, setCurrentStage] = useState(1)
	const [catData, setCatData] = useState<CategoryItem[]>([
		{ id: crypto.randomUUID(), name: '' },
		{ id: crypto.randomUUID(), name: '' },
		{ id: crypto.randomUUID(), name: '' },
	])
	const [actData, setActData] = useState<AccountItem[]>([
		{ id: crypto.randomUUID(), name: '', starting_amount: '0.00' },
		{ id: crypto.randomUUID(), name: '', starting_amount: '0.00' },
		{ id: crypto.randomUUID(), name: '', starting_amount: '0.00' },
	])

	const stages = genStages(catData, setCatData, setCurrentStage, actData, setActData)
	const progressBar = (() => {
		const items: JSX.Element[] = []
		for (let i = 1; i <= stages.length; i++) {
			let circleClassName = s.circle

			if (i < currentStage) {
				circleClassName += ' ' + s.before
			} else if (i === currentStage) {
				circleClassName += ' ' + s.current
			} else if (i > currentStage) {
				circleClassName += ' ' + s.after
			}
			items.push(<div className={circleClassName}></div>)

			let barClassName = s.bar
			if (i >= currentStage) {
				barClassName += ' ' + s.after
			} else {
				barClassName += ' ' + s.before
			}

			if (i !== stages.length) {
				items.push(
					<div className={barClassName}>
						<div className={s.progress} />
					</div>
				)
			}
		}
		return <div className={s.progress_bar}>{items}</div>
	})()

	return (
		<div className={s.main}>
			<div className={s.stage_container}>
				<div className={s.progress_container}>{progressBar}</div>
				<div className={s.stage_content}>{stages[currentStage - 1]}</div>
			</div>
			<div style={{ display: 'flex' }}>
				<button
					onClick={() =>
						setCurrentStage((p) => {
							if (p === 1) {
								return p
							}
							return p - 1
						})
					}
				>
					-
				</button>
				{currentStage}
				<button
					onClick={() =>
						setCurrentStage((p) => {
							if (p === stages.length) {
								return p
							}
							return p + 1
						})
					}
				>
					+
				</button>
			</div>
		</div>
	)
}
