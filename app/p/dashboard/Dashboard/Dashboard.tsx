'use client'
import s from './Dashboard.module.scss'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { useDashboardController } from './hooks'
import { default as LoadingAnim } from '@/public/loading.svg'
import { createPopup } from '@/utils'
import { JButton } from '@/components/JForm'
import { fetchInitSetupProgress } from '@/database'
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
	const dashCtrl = useDashboardController()

	const startTutorial = () => {
		triggerTutorial(
			dashCtrl.tiles.data.curRef,
			dashCtrl.tiles.data.set,
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
									await dashCtrl.reloadAll()
									startTutorial()
								}}
							/>
						),
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
		if (!dashCtrl.data.isPendingSave) {
			dashCtrl.reloadAll()
		}
	}, [])

	// adjust dashboard width/height to match needed space for tiles
	const tileContainerRef = useRef<HTMLDivElement>(null)
	useLayoutEffect(() => {
		tileContainerRef.current!.style.width = dashCtrl.tiles.containerMaxWidth
	}, [dashCtrl.tiles.containerMaxWidth])
	useLayoutEffect(() => {
		tileContainerRef.current!.style.width = dashCtrl.tiles.containerMaxHeight
	}, [dashCtrl.tiles.containerMaxHeight])

	const handleNewTileClick = () => {
		const popup = createPopup({
			content: (
				<AddTilePopup
					closePopup={() => popup.close()}
					data={dashCtrl.data}
					setTileData={dashCtrl.tiles.data.set}
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
						dashCtrl.discard()
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
		<div className={`${s.main} ${dashCtrl.loading ? s.loading : ''}`}>
			<div className={s.loading_anim_container}>
				<LoadingAnim />
			</div>
			<div className={s.tile_wrapper}>
				<div className={s.tile_container} ref={tileContainerRef}>
					{dashCtrl.tiles.displayElements}
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
							onClick: dashCtrl.tiles.resetPositions,
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
											refreshAllData={dashCtrl.reloadAll}
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
											refreshAllData={dashCtrl.reloadAll}
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
					disabled={!dashCtrl.changesArePending}
					onClick={handleDiscard}
				>
					Discard Changes
				</JButton>
				<JButton
					jstyle='primary'
					className={s.save}
					disabled={!dashCtrl.changesArePending}
					loading={dashCtrl.loading}
					onClick={dashCtrl.save}
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
