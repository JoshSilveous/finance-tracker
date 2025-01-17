import { JButton } from '@/components/JForm'
import {
	CategoryItem,
	TutorialCategoryEditor,
} from '../TutorialCategoryEditor/TutorialCategoryEditor'
import s from './genStages.module.scss'
import { Dispatch, SetStateAction } from 'react'
import {
	AccountItem,
	TutorialAccountEditor,
} from '../TutorialAccountEditor/TutorialAccountEditor'
export function genStages(
	catData: CategoryItem[],
	setCatData: Dispatch<SetStateAction<CategoryItem[]>>,
	setCurrentStage: Dispatch<SetStateAction<number>>,
	actData: AccountItem[],
	setActData: Dispatch<SetStateAction<AccountItem[]>>
) {
	const categoriesContinueDisabled: boolean = (() => {
		if (catData.length === 0) {
			return true
		}
		return !catData.some((cat) => !!cat.name)
	})()
	const accountContinueDisabled: boolean = (() => {
		if (actData.length === 0) {
			return true
		}
		return !actData.some((act) => !!act.name)
	})()
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
				<p>
					<strong>Categories</strong> help you track where your money goes. You can
					create as many categories as you need, making them as specific or broad
					as you want to fit your needs.
				</p>
			</div>
			<div className={s.editor_container}>
				<div className={s.editor}>
					<TutorialCategoryEditor catData={catData} setCatData={setCatData} />
				</div>
			</div>
			<div className={s.button_container}>
				<JButton jstyle='secondary' onClick={() => setCurrentStage((p) => p - 1)}>
					Back
				</JButton>
				<JButton
					jstyle='primary'
					disabled={categoriesContinueDisabled}
					title={
						categoriesContinueDisabled
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
			<h2>Set up Accounts</h2>
			<div className={s.top_text}>
				<p>
					<strong>Accounts</strong> represent your bank accounts, loans, or any
					type of balance you'd like to keep track of.
				</p>
				<p>
					For each account, you'll set a <strong>Starting Amount</strong>—this is
					the balance of the account{' '}
					<strong>when you begin tracking transactions</strong>. As you add
					transactions, the starting amount will update to show your current
					account balance.
				</p>
			</div>
			<div className={s.editor_container}>
				<div className={s.editor}>
					<TutorialAccountEditor actData={actData} setActData={setActData} />
				</div>
			</div>
			<div className={s.button_container}>
				<JButton jstyle='secondary' onClick={() => setCurrentStage((p) => p - 1)}>
					Back
				</JButton>
				<JButton
					jstyle='primary'
					disabled={accountContinueDisabled}
					title={
						accountContinueDisabled
							? 'You must have at least 1 account before continuing'
							: undefined
					}
					onClick={() => setCurrentStage((p) => p + 1)}
				>
					Next
				</JButton>
			</div>
		</div>,
	]

	return stages
}
