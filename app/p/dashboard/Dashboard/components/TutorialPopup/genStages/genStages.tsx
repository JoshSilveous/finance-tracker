import { JButton } from '@/components/JForm'
import {
	CategoryItem,
	TutorialCategoryEditor,
} from '../TutorialCategoryEditor/TutorialCategoryEditor'
import s from './genStages.module.scss'
import { Dispatch, SetStateAction } from 'react'
export function genStages(
	catData: CategoryItem[],
	setCatData: Dispatch<SetStateAction<CategoryItem[]>>,
	setCurrentStage: Dispatch<SetStateAction<number>>
) {
	const tempContent = <TutorialCategoryEditor catData={catData} setCatData={setCatData} />
	const stages: JSX.Element[] = [
		<div className={s.stage_welcome}>
			Welcome!
			<div className={s.button_container}>
				<div />
				<JButton
					jstyle='primary'
					disabled={catData.length === 0}
					title={
						catData.length === 0
							? 'You must have at least 1 category before continuing'
							: undefined
					}
					onClick={() => setCurrentStage((p) => p + 1)}
				>
					Next
				</JButton>
			</div>
		</div>,
		<div className={s.stage_categories}>
			<h2>Set up Categories</h2>
			<div className={s.top_text}>
				<strong>Categories</strong> help you track where your money goes. You can
				create as many categories as you need, making them as specific or broad as
				you want to fit your needs.
			</div>
			<div className={s.editor_container}>
				<div className={s.editor}>{tempContent}</div>
			</div>
			<div className={s.button_container}>
				<JButton jstyle='secondary' onClick={() => setCurrentStage((p) => p - 1)}>
					Back
				</JButton>
				<JButton
					jstyle='primary'
					disabled={catData.length === 0}
					title={
						catData.length === 0
							? 'You must have at least 1 category before continuing'
							: undefined
					}
					onClick={() => setCurrentStage((p) => p + 1)}
				>
					Next
				</JButton>
			</div>
		</div>,
		tempContent,
		tempContent,
		tempContent,
	]

	return stages
}
