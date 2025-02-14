'use client'
import s from './Dashboard.module.scss'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useFoldState, useSortOrder, useHistory, useData } from './hooks'
import { default as LoadingAnim } from '@/public/loading.svg'
import { areDeeplyEqual, createPopup, delay } from '@/utils'
import { JButton } from '@/components/JForm'
import { genDisplayTiles, TileData } from './tiles'
import { GRID_SPACING } from '@/app/globals'
import { fetchTileData, upsertTiles, fetchInitSetupProgress } from '@/database'
import { saveChanges } from './func/saveChanges'
import { AddTilePopup } from './tiles/AddTilePopup/AddTilePopup'
import { FeedbackPopup } from '@/components/FeedbackPopup/FeedbackPopup'
import { CategoryEditorPopup } from './components/CategoryEditorPopup/CategoryEditorPopup'
import { AccountEditorPopup } from './components/AccountEditorPopup/AccountEditorPopup'
import { JFlyoutMenu } from '@/components/JFlyoutMenu/JFlyoutMenu'
import { InitialSetupPopup } from './components/InitialSetupPopup/InitialSetupPopup'
import { triggerTutorial } from './func/triggerTutorial/triggerTutorial'
import { DiscardConfirmPopup } from './components/DiscardConfirmPopup/DiscardConfirmPopup'
import { blockOnMobile } from '@/utils/blockOnMobile/blockOnMobile'

export function Dashboard() {
	const [isLoading, setIsLoading] = useState(true)
	const origTileDataRef = useRef<TileData[]>([])
	const curTileDataRef = useRef<TileData[]>([])
	const [tileData, setTileData] = useState<TileData[]>([])
	const data = useData({
		onReload: (newData) => {
			// re-generate sort order & foldState
			foldState.genDefault(newData.transactions)
			sortOrder.genDefaultSortOrder(newData.transactions)
		},
		getSortOrderController: () => sortOrder,
		getHistoryController: () => historyController,
	})

	const startTutorial = () => {
		triggerTutorial(curTileDataRef.current, setTileData, tileContainerRef)
	}
	useEffect(() => {
		fetchInitSetupProgress()
			.then((res) => {
				if (!res.completed) {
					const popup = createPopup({
						content: (
							<InitialSetupPopup
								closePopup={async () => {
									popup.close()
									await refreshAllData()
									startTutorial()
								}}
							/>
						),
						hideExitButton: true,
					})
					popup.trigger()
				}
			})
			.catch((e) => console.error(e))
	}, [])
	useEffect(() => {
		blockOnMobile()
	}, [])
	useEffect(() => {
		if (!data.isPendingSave) {
			refreshAllData().then(() => {
				setIsLoading(false)
			})
		}
	}, [])
	const refreshAllData = async () => {
		const [_, tileDataRes] = await Promise.all([data.reload(), fetchTileData()])
		setTileData(tileDataRes)
		origTileDataRef.current = tileDataRes
	}

	const transactionManagerRowsRef = useRef<TransactionManagerRowsRef>({})
	const setTransactionManagerRowRef =
		(transaction_id: string) => (node: HTMLInputElement) => {
			/**
			 * References the DOM elements of each transaction row. Used for resorting logic.
			 */
			transactionManagerRowsRef.current[transaction_id] = node
		}

	const foldState = useFoldState()
	const sortOrder = useSortOrder({
		getFoldState: foldState.get,
		updateFoldState: foldState.update,
		afterTransactionPositionChange: (date, oldIndex, newIndex) => {
			historyController.add({
				type: 'transaction_position_change',
				date: date,
				oldIndex: oldIndex,
				newIndex: newIndex,
			})
		},
		afterItemPositionChange: (transaction, oldItemIndex, newItemIndex) => {
			historyController.add({
				type: 'item_position_change',
				transaction_id: transaction.id,
				date: transaction.date.val,
				oldIndex: oldItemIndex,
				newIndex: newItemIndex,
			})
		},
		transactionManagerRowsRef,
	})
	const historyController = useHistory({
		data,
		sortOrder,
	})
	const tileContainerRef = useRef<HTMLDivElement>(null)

	useLayoutEffect(() => {
		// re-calculate size needed for dashboard component
		curTileDataRef.current = tileData

		const [maxWidth, maxHeight] = (() => {
			let maxWidth = 0
			let maxHeight = 0

			tileData.forEach((tile) => {
				const { top, left } = tile.position
				const { width, height } = tile.size

				maxWidth = Math.max(maxWidth, left + width)
				maxHeight = Math.max(maxHeight, top + height)
			})
			return [maxWidth, maxHeight]
		})()

		tileContainerRef.current!.style.width = `calc(${maxWidth}px + (var(--GRID_SPACING) * 3))`
		tileContainerRef.current!.style.height = `calc(${maxHeight}px + (var(--GRID_SPACING) * 3))`
	}, [tileData])

	const resetTilePositions = () => {
		setTileData((prev) => {
			const clone = structuredClone(prev)
			const tileCount = clone.length
			clone.forEach((tile, index) => {
				const left = (index + 1) * GRID_SPACING
				const top = (tileCount - index) * GRID_SPACING
				tile.position = { top, left }
				tile.zIndex = index + 1
			})
			return clone
		})
	}

	const changesArePending: boolean = (() => {
		if (data.isPendingSave) {
			// covers actual data changes
			return true
		}
		if (!areDeeplyEqual(sortOrder.cur, sortOrder.def)) {
			// covers sort order
			return true
		}
		// check differences in tiles
		if (!areDeeplyEqual(tileData, origTileDataRef.current)) {
			return true
		}
		return false
	})()

	const handleSave = async () => {
		await saveChanges(
			data,
			tileData,
			origTileDataRef,
			sortOrder,
			refreshAllData,
			setIsLoading
		)
	}

	const tiles = genDisplayTiles(
		tileData,
		origTileDataRef,
		setTileData,
		data,
		foldState,
		sortOrder,
		historyController,
		setTransactionManagerRowRef,
		changesArePending,
		handleSave
	)

	const handleNewTileClick = () => {
		const popup = createPopup({
			content: (
				<AddTilePopup
					closePopup={() => popup.close()}
					data={data}
					setTileData={setTileData}
				/>
			),
		})
		popup.trigger()
	}

	const handleDiscard = () => {
		function discardChanges() {
			data.clearChanges()
			setTileData(origTileDataRef.current)
			sortOrder.discardChanges()
		}
		const popup = createPopup({
			content: (
				<DiscardConfirmPopup
					onBackout={() => popup.close()}
					onConfirm={() => {
						discardChanges()
						popup.close()
					}}
				/>
			),
		})
		popup.trigger()
	}

	const handleFeedback = () => {
		const popup = createPopup({
			content: (
				<FeedbackPopup
					closePopup={() => {
						popup.close()
					}}
					feedbackSource='dashboard_general'
					header='Submit Feedback'
				/>
			),
		})
		popup.trigger()
	}

	return (
		<div className={`${s.main} ${isLoading ? s.loading : ''}`}>
			<div className={s.loading_anim_container}>
				<LoadingAnim />
			</div>
			<div className={s.tile_wrapper}>
				<div className={s.tile_container} ref={tileContainerRef}>
					{tiles}
				</div>
			</div>
			<div className={s.bottom_container}>
				<JFlyoutMenu
					title={<>Options</>}
					jstyle='secondary'
					className={s.options_flyout}
					options={[
						{ content: <>Add New Tile</>, onClick: handleNewTileClick },
						{ content: <>Reset Tile Positions</>, onClick: resetTilePositions },
						{
							content: <>Edit Categories</>,
							onClick: () => {
								const catEditorPopup = createPopup({
									content: (
										<CategoryEditorPopup
											closePopup={() => {
												catEditorPopup.close()
											}}
											refreshAllData={refreshAllData}
											isPopup
										/>
									),
								})
								catEditorPopup.trigger()
							},
						},
						{
							content: <>Edit Accounts</>,
							onClick: () => {
								const actEditorPopup = createPopup({
									content: (
										<AccountEditorPopup
											closePopup={() => {
												actEditorPopup.close()
											}}
											refreshAllData={refreshAllData}
										/>
									),
								})
								actEditorPopup.trigger()
							},
						},
						{
							content: <>Tutorial</>,
							onClick: () => {
								startTutorial()
							},
						},
					]}
				/>
				<JButton
					jstyle='invisible'
					className={s.submit_feedback}
					onClick={handleFeedback}
				>
					Submit Feedback
				</JButton>
				<JButton
					jstyle='secondary'
					className={s.discard}
					disabled={!changesArePending}
					onClick={handleDiscard}
				>
					Discard Changes
				</JButton>
				<JButton
					jstyle='primary'
					className={s.save}
					disabled={!changesArePending}
					loading={isLoading}
					onClick={handleSave}
				>
					Save Changes
				</JButton>
			</div>
		</div>
	)
}

/**
 * References the parent row HTML elements of each transaction
 */
export type TransactionManagerRowsRef = {
	[id: string]: HTMLDivElement | null
}
