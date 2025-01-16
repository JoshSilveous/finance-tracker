import { CategoryEditorPopup } from '../CategoryEditorPopup/CategoryEditorPopup'
import s from './TutorialPopup.module.scss'
export function TutorialPopup({ startingStage }: { startingStage: number }) {
	const stage1 = (
		<div className={s.stage_container}>
			<div>Stage 1!</div>
			<CategoryEditorPopup />
		</div>
	)
	return (
		<div className={s.main}>
			<h2>Welcome!</h2>
			<p>Thank you for using my app!</p>
			{stage1}
		</div>
	)
}
