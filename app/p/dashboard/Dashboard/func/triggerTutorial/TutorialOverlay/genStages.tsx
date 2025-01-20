import transactionManagerStyles from '../../../tiles/TransactionManager/TransactionManager.module.scss'
import dashboardStyles from '../../../Dashboard.module.scss'
import multiRowStyles from '../../../tiles/TransactionManager/components/MultiRow/MultiRow.module.scss'
import optionsMenuStyles from '../../../tiles/TransactionManager/components/OptionsMenu/OptionsMenu.module.scss'
import s from './TutorialOverlay.module.scss'
import { clearGlobalInterval, delay, runRepeatedly, setGlobalInterval } from '@/utils'
import { JFLYOUT_TRANSITION_TIME_MS } from '@/components/JFlyoutMenu/JFlyoutMenu'
import { MutableRefObject } from 'react'

export function genStages(
	regenStages: () => void,
	prevStageRef: MutableRefObject<number | null>
) {
	const stageOrder = [
		'welcome_stage',
		'tm_overview',
		'tm_reorder',
		'tm_fold',
		'tm_more_options',
		'dash_options',
	]

	const stages: StageConfig[] = (() => {
		const welcome_stage = (() => {
			const dimensions = {
				height: 200,
				width: 300,
				top: window.innerHeight / 2 - 200 / 2,
				left: window.innerWidth / 2 - 300 / 2,
				borderRadius: 20,
			}

			return {
				id: 'welcome_stage',
				cutoutDimensions: dimensions,
				tipDimensions: dimensions,
				tipContent: (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							flexDirection: 'column',
							height: '100%',
						}}
					>
						<p>
							Welcome to the <strong>Tutorial</strong>.
						</p>
						<p>
							This will give you a brief walkthrough of the dashboard, and how
							to use this app.
						</p>
					</div>
				),
			}
		})()

		const transactionManagerStages = (() => {
			const transactionManagerRect = (
				document.querySelector(`.${transactionManagerStyles.main}`) as HTMLDivElement
			).getBoundingClientRect()
			const margin = 10
			const tipHeight = 200
			const tipWidth = 300

			const managerCutoutDimensions = {
				top: transactionManagerRect.top - margin,
				left: transactionManagerRect.left - margin,
				width: transactionManagerRect.width + margin * 2 - 3,
				height: transactionManagerRect.height + margin * 2 - 3,
				borderRadius: 30,
			}
			const tipDimensions = {
				top:
					transactionManagerRect.top +
					transactionManagerRect.height / 2 -
					tipHeight / 2,
				left:
					transactionManagerRect.left + transactionManagerRect.width + margin * 3,
				width: tipWidth,
				height: tipHeight,
				borderRadius: 10,
			}

			const tm_overview: StageConfig = {
				id: 'tm_overview',
				cutoutDimensions: managerCutoutDimensions,
				tipDimensions: { ...tipDimensions, height: 160 },
				tipContent: (
					<div>
						<p>
							This is the <strong>Transaction Manager</strong>.
						</p>
						<p>
							Here is where you'll enter your transactions, payments, and
							anything that affects your account balances.
						</p>
					</div>
				),
			}

			const tm_reorder: StageConfig = (() => {
				const reorderNodes = Array.from(
					document.querySelectorAll(`[class*="reorder_grabber"]`)
				) as HTMLDivElement[]

				const calcedTop = (() => {
					const firstNodeTop = reorderNodes[0].getBoundingClientRect().top
					const lastNodeBottom = reorderNodes
						.at(-1)!
						.getBoundingClientRect().bottom
					const difference = lastNodeBottom - firstNodeTop
					return firstNodeTop + difference / 2 - tipDimensions.height / 2
				})()

				return {
					id: 'tm_reorder',
					cutoutDimensions: managerCutoutDimensions,
					tipDimensions: {
						...tipDimensions,
						top: calcedTop,
					},
					tipContent: (
						<div>
							<p>
								These buttons can be used to sort/reorder your transactions
								and items.
							</p>
							<p>
								You can either click-and-drag with your mouse, or use the Up
								and Down arrows on your keyboard.
							</p>
						</div>
					),
					subHighlights: reorderNodes.map((node) => {
						const nodeDim = node.getBoundingClientRect()
						return {
							top: nodeDim.top - 2,
							left: nodeDim.left - 2,
							height: nodeDim.height,
							width: nodeDim.width,
							borderRadius: 5,
						}
					}),
					onSwitchedTo: () => {
						delay(10).then(() => regenStages())
					},
				}
			})()

			const tm_fold: StageConfig = (() => {
				const foldNode = document.querySelector(
					`.${multiRowStyles.fold_toggle}`
				) as HTMLDivElement
				const foldNodeButton = foldNode.children[0] as HTMLButtonElement
				const nodeRect = foldNode.getBoundingClientRect()

				const onSwitchedTo = () => {
					const FIRST_FOLD_DELAY = 400
					const UNFOLD_DELAY = 1000
					const LOOP_DELAY = 2000
					delay(FIRST_FOLD_DELAY).then(() => {
						if (stageOrder[prevStageRef.current!] === 'tm_fold') {
							foldNodeButton.click()
							delay(UNFOLD_DELAY).then(() => {
								if (stageOrder[prevStageRef.current!] === 'tm_fold') {
									foldNodeButton.click()
								}
							})
						}
						setGlobalInterval('FOLD_ANIM', LOOP_DELAY + UNFOLD_DELAY, () => {
							if (stageOrder[prevStageRef.current!] === 'tm_fold') {
								foldNodeButton.click()
								delay(UNFOLD_DELAY).then(() => {
									if (stageOrder[prevStageRef.current!] === 'tm_fold') {
										foldNodeButton.click()
									}
								})
							}
						})
					})
				}
				const onSwitchedOff = () => {
					clearGlobalInterval('FOLD_ANIM')
					if (foldNode.classList.contains(multiRowStyles.folded)) {
						foldNodeButton.click()
					}
				}

				return {
					id: 'tm_fold',
					cutoutDimensions: managerCutoutDimensions,
					tipDimensions: {
						...tipDimensions,
						top: nodeRect.top + nodeRect.height / 2 - tipDimensions.height / 2,
					},
					tipContent: (
						<div>
							<p>
								Use this button to fold/unfold transactions that have
								multiple items. It helps reduce the clutter a bit.
							</p>
						</div>
					),
					subHighlights: [
						{
							top: nodeRect.top - 1,
							left: nodeRect.left - 2,
							width: nodeRect.width,
							height: nodeRect.height,
							borderRadius: 5,
						},
					],
					onSwitchedTo,
					onSwitchedOff,
				}
			})()

			const tm_more_options: StageConfig = (() => {
				const moreOptionsNode = document.querySelector(
					`.${optionsMenuStyles.popout}`
				) as HTMLDivElement

				const margin = 3

				const moreOptionsButton = moreOptionsNode.children[0]
					.children[1] as HTMLButtonElement
				const openedHeight = Number(moreOptionsNode.dataset.opened_height)
				const openedWidth = Number(moreOptionsNode.dataset.opened_width)
				const nodeRect = moreOptionsNode.getBoundingClientRect()

				const isOpened = moreOptionsNode.classList.contains(
					optionsMenuStyles.revealed
				)

				return {
					id: 'tm_more_options',
					cutoutDimensions: managerCutoutDimensions,
					tipDimensions: {
						...tipDimensions,
						top: nodeRect.top + openedHeight / 2 - tipDimensions.height / 2,
					},
					tipContent: (
						<div>
							This <strong>Options Menu</strong> allows you to add items to a
							transaction, as well as delete the transaction.
						</div>
					),
					subHighlights: [
						{
							top: nodeRect.top - 2 - margin,
							left: isOpened
								? nodeRect.left - 2 - margin - openedWidth + nodeRect.width
								: nodeRect.left - 2 - margin,
							height: isOpened
								? openedHeight + margin * 2
								: nodeRect.height + margin * 2,
							width: isOpened
								? openedWidth + margin * 2
								: nodeRect.width + margin * 2,
							borderRadius: isOpened ? 8 : 5,
						},
					],
					onSwitchedTo: () => {
						delay(800).then(() => {
							if (stageOrder[prevStageRef.current!] === 'tm_more_options') {
								moreOptionsButton.click()
							}
							delay(10).then(() => {
								regenStages()
							})
						})
					},
					onSwitchedOff: () => {
						if (moreOptionsNode.classList.contains(optionsMenuStyles.revealed)) {
							moreOptionsButton.click()
							delay(10).then(() => {
								regenStages()
							})
						}
					},
				}
			})()

			return [tm_overview, tm_reorder, tm_fold, tm_more_options]
		})()

		const dash_options: StageConfig = (() => {
			const node = document.querySelector(`.${dashboardStyles.options_flyout}`)!
				.children[0] as HTMLDivElement

			const flyoutOpenedHeight = Number(node.dataset.opened_height)!
			const rect = node.getBoundingClientRect()

			const margin = 10

			const tip = <div className={s.tip}>Tip!</div>
			const tipHeight = 100
			return {
				id: 'dash_options',
				cutoutDimensions: {
					top: rect.top + rect.height - flyoutOpenedHeight - margin,
					left: rect.left - margin,
					width: rect.width + margin * 2 - 3,
					height: flyoutOpenedHeight + margin * 2 - 3,
					borderRadius: 10,
				},
				tipDimensions: {
					top:
						rect.top + rect.height - flyoutOpenedHeight - margin * 2 - tipHeight,
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
		return [...transactionManagerStages, dash_options, welcome_stage] as StageConfig[]
	})()

	return stageOrder.map((id) => stages.find((stg) => stg.id === id)!)
}

export type StageConfig = {
	id: string
	cutoutDimensions: {
		top: number
		left: number
		width: number
		height: number
		borderRadius: number
	}
	tipDimensions: {
		top: number
		left: number
		width: number
		height: number
		borderRadius: number
	}
	subHighlights?: {
		top: number
		left: number
		width: number
		height: number
		borderRadius: number
	}[]
	tipContent: JSX.Element
	onSwitchedTo?: () => void
	onSwitchedOff?: () => void
}
