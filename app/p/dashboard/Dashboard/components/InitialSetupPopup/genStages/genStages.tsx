import { JButton } from '@/components/JForm'
import {
	CategoryItem,
	InitialSetupCategoryEditor,
} from '../InitialSetupCategoryEditor/InitialSetupCategoryEditor'
import s from './genStages.module.scss'
import { Dispatch, SetStateAction } from 'react'
import {
	AccountItem,
	InitialSetupAccountEditor,
} from '../InitialSetupAccountEditor/InitialSetupAccountEditor'
export function genStages(
	catData: CategoryItem[],
	setCatData: Dispatch<SetStateAction<CategoryItem[]>>,
	setCurrentStage: Dispatch<SetStateAction<number>>,
	actData: AccountItem[],
	setActData: Dispatch<SetStateAction<AccountItem[]>>,
	afterComplete: () => void
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
			<h2>Welcome!</h2>
			<div className={s.paragraph_container}>
				<p>
					This application allows you to track your finances by using different{' '}
					<strong>Categories</strong> and <strong>Accounts</strong>. Right now, you
					can consider this as a <strong>Beta Test</strong>, as many features that
					I'd like to have are still in the works.
				</p>
				<p>
					This is a passion project of mine. I've put tons of hours of hard work
					into this, and I've learned a lot about structuring a project of this
					size (as well as neat JavaScript/React tricks).
				</p>
				<p>
					And if you stumbled upon this without knowing who I am, be sure to check
					out my <a href='https://silveo.us/'>Portfolio Site</a>. I enjoy writing
					code and building apps a ton, and would love to make a career out of it.
				</p>
				<p>Thank you all for using my app!</p>
				<p style={{ textAlign: 'right' }}>- Joshua Silveous</p>
			</div>
			<div className={s.button_container}>
				<div />
				<JButton
					jstyle='primary'
					disabled={catData.length === 0}
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
					<InitialSetupCategoryEditor catData={catData} setCatData={setCatData} />
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
		<div className={s.stage_accounts}>
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
					<InitialSetupAccountEditor actData={actData} setActData={setActData} />
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
		<div className={s.stage_confirm}>
			<h2>Ready to continue?</h2>
			<div className={s.top_text}>
				<p>
					After continuing, the categories and accounts you've set up will be
					saved. These can be edited at any time.
				</p>
				<p>Up next is a brief walkthrough of how to navigate the dashboard.</p>
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
					onClick={() => {
						setCurrentStage((p) => p + 1)
						afterComplete()
					}}
				>
					Finish
				</JButton>
			</div>
		</div>,
	]

	return stages
}
