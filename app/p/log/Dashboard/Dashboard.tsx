'use client'
import { Tile } from '@/components/Tile/Tile'
import s from './Dashboard.module.scss'
import {
	TransactionManager,
	TransactionManagerProps,
} from '../TransactionManager/TransactionManager'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Data } from './hooks/useData/useData'
import { useFoldState, useSortOrder, useHistory, useData } from './hooks'
import { getScrollbarWidth } from '@/utils'
import { JButton } from '@/components/JForm'
import { genDisplayTiles, TileData } from './func/tiles'

export function Dashboard() {
	const data = useData({
		onReload: (newData) => {
			// re-generate sort order & foldState
			foldState.genDefault(newData.transactions)
			sortOrder.genDefaultSortOrder(newData.transactions)
		},
	})
	useEffect(() => {
		data.reload()
	}, [])

	useEffect(() => {
		data.reload()
	}, [])
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
		/**
		 * Sets the `--scrollbar-width` css variable, used for smooth scrollbar animations across any browser
		 */
		if (tileContainerRef.current !== null) {
			tileContainerRef.current.style.setProperty(
				'--scrollbar-width',
				getScrollbarWidth() + 'px'
			)
		}
	}, [])

	const [tileData, setTileData] = useState<TileData[]>([
		{
			type: 'transaction_manager',
			position: {
				top: 30,
				left: 30,
			},
			size: {
				width: 990,
				height: 690,
			},
			zIndex: 1,
		},
	])

	useLayoutEffect(() => {
		// re-calculate size needed for dashboard component

		let maxWidth = 0
		let maxHeight = 0

		tileData.forEach((tile) => {
			const { top, left } = tile.position
			const { width, height } = tile.size

			maxWidth = Math.max(maxWidth, left + width)
			maxHeight = Math.max(maxHeight, top + height)
		})

		console.log(maxWidth, maxHeight)
		tileContainerRef.current!.style.width = `calc(${maxWidth}px + (var(--GRID-SPACING) * 3))`
		tileContainerRef.current!.style.height = `calc(${maxHeight}px + (var(--GRID-SPACING) * 3))`
	}, [tileData])

	const tiles = genDisplayTiles(
		tileData,
		setTileData,
		data,
		foldState,
		sortOrder,
		historyController,
		setTransactionManagerRowRef
	)

	return (
		<div className={s.main}>
			<div className={s.tile_wrapper}>
				<div className={s.tile_container} ref={tileContainerRef}>
					{tiles}
				</div>
			</div>
			<div className={s.bottom_container}>
				<JButton jstyle='secondary' className={s.reset}>
					Reset Tile Positions
				</JButton>
				<JButton jstyle='secondary' className={s.discard}>
					Discard Changes
				</JButton>
				<JButton jstyle='primary' className={s.save}>
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
