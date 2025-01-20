import transactionManagerStyles from '../../../tiles/TransactionManager/TransactionManager.module.scss'
import dashboardStyles from '../../../Dashboard.module.scss'
import s from './TutorialOverlay.module.scss'
import { delay, runRepeatedly } from '@/utils'
import { JFLYOUT_TRANSITION_TIME_MS } from '@/components/JFlyoutMenu/JFlyoutMenu'

export function genStages() {
	const transaction_manager: StageConfig = (() => {
		const rect = (
			document.querySelector(`.${transactionManagerStyles.main}`) as HTMLDivElement
		).getBoundingClientRect()
		const margin = 10
		return {
			cutoutDimensions: {
				top: rect.top - margin,
				left: rect.left - margin,
				width: rect.width + margin * 2 - 3,
				height: rect.height + margin * 2 - 3,
				borderRadius: 30,
			},
			tipDimentions: {
				top: 0,
				left: 0,
				width: 0,
				height: 0,
				borderRadius: 0,
			},
			tipContent: <div>Hello!</div>,
		}
	})()

	const options: StageConfig = (() => {
		const node = document.querySelector(`.${dashboardStyles.options_flyout}`)!
			.children[0] as HTMLDivElement

		const flyoutOpenedHeight = Number(node.dataset.opened_height)!
		const rect = node.getBoundingClientRect()

		const margin = 10

		const tip = <div className={s.tip}>Tip!</div>
		const tipHeight = 100
		return {
			cutoutDimensions: {
				top: rect.top + rect.height - flyoutOpenedHeight - margin,
				left: rect.left - margin,
				width: rect.width + margin * 2 - 3,
				height: flyoutOpenedHeight + margin * 2 - 3,
				borderRadius: 10,
			},
			tipDimentions: {
				top: rect.top + rect.height - flyoutOpenedHeight - margin * 2 - tipHeight,
				left: rect.left - margin,
				width: rect.width + margin * 2 - 3,
				height: tipHeight,
				borderRadius: 10,
			},
			tipContent: tip,
			onSwitchedTo: () => {
				// select the button node to open/close menu
				const buttonNode = node.children[1] as HTMLButtonElement
				if (buttonNode.tagName !== 'BUTTON') {
					throw new Error(
						'buttonNode seems to be pointing to the wrong node now. update the DOM path to point to the correct node.'
					)
				}
				buttonNode.click()
			},
			onSwitchedOff: () => {
				const buttonNode = node.children[1] as HTMLButtonElement
				if (buttonNode.tagName !== 'BUTTON') {
					throw new Error(
						'buttonNode seems to be pointing to the wrong node now. update the DOM path to point to the correct node.'
					)
				}
				buttonNode.click()
			},
		}
	})()

	return {
		transaction_manager,
		options,
	} as Stages
}

export type StageName = keyof Stages
export type Stages = {
	transaction_manager: StageConfig
	options: StageConfig
}
export type StageConfig = {
	cutoutDimensions: {
		top: number
		left: number
		width: number
		height: number
		borderRadius: number
	}
	tipDimentions: {
		top: number
		left: number
		width: number
		height: number
		borderRadius: number
	}
	tipContent: JSX.Element
	onSwitchedTo?: () => void
	onSwitchedOff?: () => void
}
