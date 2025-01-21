import transactionManagerStyles from '../../../tiles/TransactionManager/TransactionManager.module.scss'
import dashboardStyles from '../../../Dashboard.module.scss'
import multiRowStyles from '../../../tiles/TransactionManager/components/MultiRow/MultiRow.module.scss'
import optionsMenuStyles from '../../../tiles/TransactionManager/components/OptionsMenu/OptionsMenu.module.scss'
import simpleValuesStyles from '../../../tiles/SimpleValues/SimpleValues.module.scss'
import s from './TutorialOverlay.module.scss'
import { clearGlobalInterval, delay, setGlobalInterval } from '@/utils'
import { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { TileData } from '../../../tiles'

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
		'sv_overview',
		'sv_reposition',
		'sv_resize',
		'sv_edit',
		'dash_saving',
		'dash_options_overview',
		'dash_options_new_tile',
		'dash_options_reset_tile_position',
		'dash_options_categories_and_accounts',
		'dash_options_tutorial_trigger',
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

		const transactionManagerStages: StageConfig[] = (() => {
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
				tipDimensions: { ...tipDimensions, height: 180 },
				tipContent: (
					<div className={s.tip}>
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
						<div className={s.tip}>
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
						<div className={s.tip}>
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
						<div className={s.tip}>
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

		const simpleValuesStages: StageConfig[] = (() => {
			const simpleValuesNode = document.querySelector(
				`.${simpleValuesStyles.main}`
			) as HTMLDivElement
			const simpleValuesRect = simpleValuesNode.getBoundingClientRect()
			const cutoutMargin = 10
			const highlightMargin = 10
			const tipWidth = 300

			const managerCutoutDimensions = {
				top: simpleValuesRect.top - cutoutMargin,
				left: simpleValuesRect.left - cutoutMargin,
				width: simpleValuesRect.width + cutoutMargin * 2 - 3,
				height: simpleValuesRect.height + cutoutMargin * 2 - 3,
				borderRadius: 30,
			}
			const tipDimensions = {
				top: managerCutoutDimensions.top,
				left: simpleValuesRect.left - tipWidth - cutoutMargin * 3,
				width: tipWidth,
				height: managerCutoutDimensions.height,
				borderRadius: 10,
			}

			const sv_overview: StageConfig = {
				id: 'sv_overview',
				cutoutDimensions: managerCutoutDimensions,
				tipDimensions: tipDimensions,
				tipContent: (
					<div className={s.tip}>
						<p>
							This is a <strong>Tile.</strong> Specifically, a Simple Values
							tile.
						</p>
						<p>
							Throughout this app, you can create and customize any amount of
							tiles to show different types of data on your dashboard.
						</p>
					</div>
				),
			}

			const repositionGrabberRect =
				simpleValuesNode.parentElement!.children[2].getBoundingClientRect()
			const sv_reposition: StageConfig = {
				id: 'sv_reposition',
				cutoutDimensions: managerCutoutDimensions,
				tipDimensions: tipDimensions,
				subHighlights: [
					{
						top: repositionGrabberRect.top - highlightMargin / 2 - 2,
						left: repositionGrabberRect.left - highlightMargin / 2 - 2,
						width: repositionGrabberRect.width + highlightMargin,
						height: repositionGrabberRect.height + highlightMargin,
						borderRadius: '30px 5px 15px 5px',
					},
				],
				tipContent: (
					<div className={s.tip}>
						<p>
							Grab the <strong>Reposition Grabber</strong> in the top-left
							corner to move tiles around the dashboard.
						</p>
					</div>
				),
			}

			const resizeGrabberRect =
				simpleValuesNode.parentElement!.children[1].getBoundingClientRect()
			const sv_resize: StageConfig = {
				id: 'sv_resize',
				cutoutDimensions: managerCutoutDimensions,
				tipDimensions: tipDimensions,
				subHighlights: [
					{
						top: resizeGrabberRect.top - highlightMargin / 2 + 2,
						left: resizeGrabberRect.left - highlightMargin / 2 + 2,
						width: resizeGrabberRect.width + highlightMargin - 3,
						height: resizeGrabberRect.height + highlightMargin - 3,
						borderRadius: '15px 5px 30px 5px',
					},
				],
				tipContent: (
					<div className={s.tip}>
						<p>
							Grab the <strong>Resize Grabber</strong> in the bottom-right
							corner to resize your tiles.
						</p>
					</div>
				),
			}

			const editButtonRect =
				simpleValuesNode.parentElement!.children[3].getBoundingClientRect()
			const sv_edit: StageConfig = {
				id: 'sv_edit',
				cutoutDimensions: managerCutoutDimensions,
				tipDimensions: tipDimensions,
				subHighlights: [
					{
						top: editButtonRect.top - highlightMargin / 2 - 3,
						left: editButtonRect.left - highlightMargin / 2,
						width: editButtonRect.width + highlightMargin,
						height: editButtonRect.height + highlightMargin,
						borderRadius: '5px 30px 5px 15px',
					},
				],
				tipContent: (
					<div className={s.tip}>
						<p>
							Click the <strong>Edit Button</strong> in the top-right to change
							the settings for a tile (time period, title, exclusions) as well
							as delete it.
						</p>
					</div>
				),
			}

			return [sv_overview, sv_reposition, sv_resize, sv_edit]
		})()

		const dashboardStages: StageConfig[] = (() => {
			const dash_saving: StageConfig = (() => {
				const discardButton = document.querySelector(
					`.${dashboardStyles.discard}`
				) as HTMLButtonElement
				const saveButton = document.querySelector(
					`.${dashboardStyles.save}`
				) as HTMLButtonElement

				const discardButtonRect = discardButton.getBoundingClientRect()
				const saveButtonRect = saveButton.getBoundingClientRect()

				const margin = 5

				const tip = (
					<div className={s.tip}>
						<p>Changes are not automatically saved.</p>
						<p>
							As you make changes throughout the dashboard, they will be marked
							with{' '}
							<strong style={{ color: 'var(--font-color-changed)' }}>
								this color
							</strong>
							, indicating that these changes haven't been saved yet.
						</p>
						<p>
							Use these buttons to save those changes to the database, or to
							discard them.
						</p>
					</div>
				)
				const tipHeight = 220
				return {
					id: 'dash_saving',
					cutoutDimensions: {
						top: discardButtonRect.top - margin - 2,
						left: discardButtonRect.left - margin - 2,
						width:
							saveButtonRect.left -
							discardButtonRect.left +
							saveButtonRect.width +
							margin * 2,
						height: discardButtonRect.height + margin * 2,
						borderRadius: 10,
					},
					tipDimensions: {
						top: discardButtonRect.top - margin * 3 - tipHeight - 2,
						left: discardButtonRect.left - margin - 2,
						width:
							saveButtonRect.left -
							discardButtonRect.left +
							saveButtonRect.width +
							margin * 2,
						height: tipHeight,
						borderRadius: 10,
					},
					tipContent: tip,
					onSwitchedTo: async () => {
						await delay(800)
						if (stageOrder[prevStageRef.current!] === 'dash_saving') {
							if (discardButton.disabled) {
								discardButton.disabled = false
								discardButton.dataset.tutorial_temp_reenabled = 'true'
							}
							if (saveButton.disabled) {
								saveButton.disabled = false
								saveButton.dataset.tutorial_temp_reenabled = 'true'
							}
						}
					},
					onSwitchedOff: () => {
						if (discardButton.dataset.tutorial_temp_reenabled === 'true') {
							discardButton.disabled = true
							discardButton.dataset.tutorial_temp_reenabled = undefined
						}
						if (saveButton.dataset.tutorial_temp_reenabled === 'true') {
							saveButton.disabled = true
							saveButton.dataset.tutorial_temp_reenabled = undefined
						}
					},
				}
			})()

			const dashFlyoutStages: StageConfig[] = (() => {
				const flyoutNode = document.querySelector(
					`.${dashboardStyles.options_flyout}`
				)!.children[0] as HTMLDivElement

				const flyoutOpenedHeight = Number(flyoutNode.dataset.opened_height)!
				const flyoutRect = flyoutNode.getBoundingClientRect()

				const cutoutMargin = 10
				const subhighlightMargin = 5

				const cutoutDimensions = {
					top:
						flyoutRect.top +
						flyoutRect.height -
						flyoutOpenedHeight -
						cutoutMargin,
					left: flyoutRect.left - cutoutMargin,
					width: flyoutRect.width + cutoutMargin * 2 - 3,
					height: flyoutOpenedHeight + cutoutMargin * 2 - 3,
					borderRadius: 10,
				}

				const tipDimensions = {
					top:
						flyoutRect.top +
						flyoutRect.height -
						flyoutOpenedHeight -
						cutoutMargin,
					left: flyoutRect.left + flyoutRect.width + cutoutMargin * 2,
					width: 300,
					height: flyoutOpenedHeight + cutoutMargin * 2 - 3,
					borderRadius: 10,
				}

				const buttonNode = flyoutNode.children[1] as HTMLButtonElement

				const dash_options_overview: StageConfig = {
					id: 'dash_options_overview',
					cutoutDimensions: cutoutDimensions,
					tipDimensions: tipDimensions,
					tipContent: (
						<div className={s.tip}>
							<p>
								Over here, there are more options to customize your
								dashboard.
							</p>
						</div>
					),
					onSwitchedTo: () => {
						buttonNode.click()
					},
					onSwitchedOff: () => {
						buttonNode.click()
					},
				}

				const newTileBtnRect =
					flyoutNode.children[0].children[0].getBoundingClientRect()
				const dash_options_new_tile: StageConfig = {
					id: 'dash_options_new_tile',
					cutoutDimensions: cutoutDimensions,
					tipDimensions: tipDimensions,
					subHighlights: [
						{
							top: newTileBtnRect.top - subhighlightMargin,
							left: newTileBtnRect.left - subhighlightMargin,
							width: newTileBtnRect.width + subhighlightMargin,
							height: newTileBtnRect.height + subhighlightMargin,
							borderRadius: 5,
						},
					],
					tipContent: (
						<div className={s.tip}>
							<p>
								The <strong>Add New Tile</strong> button allows you to add
								more tiles to your dashboard.
							</p>
							<p>
								There are different types of tiles that can be added, such as
								the <strong>Simple Values</strong> tile shown earlier. You
								can add as many tiles as you'd like, and customize them each
								to show whatever information is relevant to you.
							</p>
						</div>
					),
					onSwitchedTo: () => {
						buttonNode.click()
					},
					onSwitchedOff: () => {
						buttonNode.click()
					},
				}

				const resetTileBtnRect =
					flyoutNode.children[0].children[1].getBoundingClientRect()
				const dash_options_reset_tile_position: StageConfig = {
					id: 'dash_options_reset_tile_position',
					cutoutDimensions: cutoutDimensions,
					tipDimensions: tipDimensions,
					subHighlights: [
						{
							top: resetTileBtnRect.top - subhighlightMargin,
							left: resetTileBtnRect.left - subhighlightMargin,
							width: resetTileBtnRect.width + subhighlightMargin,
							height: resetTileBtnRect.height + subhighlightMargin,
							borderRadius: 5,
						},
					],
					tipContent: (
						<div className={s.tip}>
							<p>
								The <strong>Reset Tile Positions</strong> button will move
								all of your tiles back to the top-left of your dashboard.
							</p>
						</div>
					),
					onSwitchedTo: () => {
						buttonNode.click()
					},
					onSwitchedOff: () => {
						buttonNode.click()
					},
				}

				const catBtnRect = flyoutNode.children[0].children[2].getBoundingClientRect()
				const actBtnRect = flyoutNode.children[0].children[3].getBoundingClientRect()
				const dash_options_categories_and_accounts: StageConfig = {
					id: 'dash_options_categories_and_accounts',
					cutoutDimensions: cutoutDimensions,
					tipDimensions: tipDimensions,
					subHighlights: [
						{
							top: catBtnRect.top - subhighlightMargin,
							left: catBtnRect.left - subhighlightMargin,
							width: catBtnRect.width + subhighlightMargin,
							height:
								catBtnRect.height + actBtnRect.height + subhighlightMargin,
							borderRadius: 5,
						},
					],
					tipContent: (
						<div className={s.tip}>
							<p>
								The <strong>Edit Categories</strong> and{' '}
								<strong>Edit Accounts</strong> buttons allow you to
								add/modify/delete Categories and Accounts.
							</p>
						</div>
					),
					onSwitchedTo: () => {
						buttonNode.click()
					},
					onSwitchedOff: () => {
						buttonNode.click()
					},
				}

				const tutorialBtnRect =
					flyoutNode.children[0].children[4].getBoundingClientRect()
				const dash_options_tutorial_trigger: StageConfig = {
					id: 'dash_options_tutorial_trigger',
					cutoutDimensions: cutoutDimensions,
					tipDimensions: tipDimensions,
					subHighlights: [
						{
							top: tutorialBtnRect.top - subhighlightMargin,
							left: tutorialBtnRect.left - subhighlightMargin,
							width: tutorialBtnRect.width + subhighlightMargin,
							height: tutorialBtnRect.height + subhighlightMargin,
							borderRadius: 5,
						},
					],
					tipContent: (
						<div className={s.tip}>
							<p>
								The <strong>Tutorial</strong> button allows you to re-play
								this tutorial.
							</p>
						</div>
					),
					onSwitchedTo: () => {
						buttonNode.click()
					},
					onSwitchedOff: () => {
						buttonNode.click()
					},
				}

				return [
					dash_options_overview,
					dash_options_new_tile,
					dash_options_reset_tile_position,
					dash_options_categories_and_accounts,
					dash_options_tutorial_trigger,
				]
			})()

			return [...dashFlyoutStages, dash_saving]
		})()

		return [
			...transactionManagerStages,
			...dashboardStages,
			...simpleValuesStages,
			welcome_stage,
		] as StageConfig[]
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
		borderRadius: React.CSSProperties['borderRadius']
	}
	tipDimensions: {
		top: number
		left: number
		width: number
		height: number
		borderRadius: React.CSSProperties['borderRadius']
	}
	subHighlights?: {
		top: number
		left: number
		width: number
		height: number
		borderRadius: React.CSSProperties['borderRadius']
	}[]
	tipContent: JSX.Element
	onSwitchedTo?: () => void
	onSwitchedOff?: () => void
}
