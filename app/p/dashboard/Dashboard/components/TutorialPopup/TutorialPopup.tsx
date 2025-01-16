import { useState } from 'react'
import s from './TutorialPopup.module.scss'
import {
	CategoryItem,
	TutorialCategoryEditor,
} from './TutorialCategoryEditor/TutorialCategoryEditor'
import { CategoryEditorPopup } from '../CategoryEditorPopup/CategoryEditorPopup'
export function TutorialPopup({ startingStage }: { startingStage: number }) {
	const [currentStage, setCurrentStage] = useState(1)
	const [catData, setCatData] = useState<CategoryItem[]>([])

	type Stage = {
		name: string
		content: JSX.Element
	}
	const tempContent = <TutorialCategoryEditor catData={catData} setCatData={setCatData} />
	const stages: Stage[] = [
		{
			name: 'Category Editor 1',
			content: tempContent,
		},
		{
			name: 'Category Editor 2',
			content: tempContent,
		},
		{
			name: 'Category Editor 3',
			content: tempContent,
		},
		{
			name: 'Category Editor 4',
			content: tempContent,
		},
	]
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
			<div className={s.welcome}>
				<h2>Welcome!</h2>
				<p>Thank you for using my app!</p>
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
			<div className={s.stage_container}>
				<div className={s.progress_container}>{progressBar}</div>
				<div className={s.stage_content}>
					<div className={s.title}>{stages[currentStage - 1].name}</div>
					<div className={s.content}>{stages[currentStage - 1].content}</div>
				</div>
			</div>
		</div>
	)
}
