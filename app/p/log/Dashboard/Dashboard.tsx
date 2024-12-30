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
	const mainContainerRef = useRef<HTMLDivElement>(null)
	useLayoutEffect(() => {
		/**
		 * Sets the `--scrollbar-width` css variable, used for smooth scrollbar animations across any browser
		 */
		if (mainContainerRef.current !== null) {
			mainContainerRef.current.style.setProperty(
				'--scrollbar-width',
				getScrollbarWidth() + 'px'
			)
		}
	}, [])

	return (
		<div className={s.main} ref={mainContainerRef}>
			<button onClick={data.reload}>BUTTON</button>
			<Tile
				className={s.transaction_manager_container}
				resizable
				minWidth={740}
				maxWidth={1200}
				minHeight={350}
			>
				<TransactionManager
					data={data}
					foldState={foldState}
					sortOrder={sortOrder}
					historyController={historyController}
					setTransactionManagerRowRef={setTransactionManagerRowRef}
				/>
			</Tile>
		</div>
	)
}

/**
 * References the parent row HTML elements of each transaction
 */
export type TransactionManagerRowsRef = {
	[id: string]: HTMLDivElement | null
}
