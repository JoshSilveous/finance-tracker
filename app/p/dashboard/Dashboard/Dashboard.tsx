'use client'
import s from './Dashboard.module.scss'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
	useFoldState,
	useSortOrder,
	useHistory,
	useData,
	useTiles,
	useDashboardState,
} from './hooks'
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
	const dashboardController = useDashboardState()

	const startTutorial = () => {
		triggerTutorial(
			dashboardController.tiles.data.curRef,
			dashboardController.tiles.data.set,
			tileContainerRef
		)
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
									await dashboardController.reloadAll()
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

	// only for dev, only happens on hot reload
	useEffect(() => {
		if (!dashboardController.data.isPendingSave) {
			dashboardController.reloadAll()
		}
	}, [])

	// adjust dashboard width/height to match needed space for tiles
	const tileContainerRef = useRef<HTMLDivElement>(null)
	useLayoutEffect(() => {
		tileContainerRef.current!.style.width = dashboardController.tiles.containerMaxWidth
	}, [dashboardController.tiles.containerMaxWidth])
	useLayoutEffect(() => {
		tileContainerRef.current!.style.width = dashboardController.tiles.containerMaxHeight
	}, [dashboardController.tiles.containerMaxHeight])

	const handleNewTileClick = () => {
		const popup = createPopup({
			content: (
				<AddTilePopup
					closePopup={() => popup.close()}
					data={dashboardController.data}
					setTileData={dashboardController.tiles.data.set}
				/>
			),
		})
		popup.trigger()
	}

	const handleDiscard = () => {
		const popup = createPopup({
			content: (
				<DiscardConfirmPopup
					onBackout={() => popup.close()}
					onConfirm={() => {
						dashboardController.discard()
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
		<div className={`${s.main} ${dashboardController.loading ? s.loading : ''}`}>
			<div className={s.loading_anim_container}>
				<LoadingAnim />
			</div>
			<div className={s.tile_wrapper}>
				<div className={s.tile_container} ref={tileContainerRef}>
					{dashboardController.tiles.displayElements}
				</div>
			</div>
			<div className={s.bottom_container}>
				<JFlyoutMenu
					title={<>Options</>}
					jstyle='secondary'
					className={s.options_flyout}
					options={[
						{ content: <>Add New Tile</>, onClick: handleNewTileClick },
						{
							content: <>Reset Tile Positions</>,
							onClick: dashboardController.tiles.resetPositions,
						},
						{
							content: <>Edit Categories</>,
							onClick: () => {
								const catEditorPopup = createPopup({
									content: (
										<CategoryEditorPopup
											closePopup={() => {
												catEditorPopup.close()
											}}
											refreshAllData={dashboardController.reloadAll}
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
											refreshAllData={dashboardController.reloadAll}
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
					disabled={!dashboardController.changesArePending}
					onClick={handleDiscard}
				>
					Discard Changes
				</JButton>
				<JButton
					jstyle='primary'
					className={s.save}
					disabled={!dashboardController.changesArePending}
					loading={dashboardController.loading}
					onClick={dashboardController.save}
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
