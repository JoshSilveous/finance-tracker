import { MutableRefObject, useRef, useState } from 'react'
import { TileData } from '../tiles'
import { useFoldState } from './useFoldState'
import { useHistory } from './useHistory'
import { useSortOrder } from './useSortOrder'
import { useData } from '.'
import { TransactionManagerRowsRef } from '../Dashboard'

export function useDashboardState(
	transactionManagerRowsRef: MutableRefObject<TransactionManagerRowsRef>
) {
	const [isLoading, setIsLoading] = useState(true)

	const [tileData, setTileData] = useState<TileData[]>([])
	const origTileDataRef = useRef<TileData[]>([])
	const curTileDataRef = useRef<TileData[]>([])

	const dataController = useData({
		onReload: (newData) => {
			// re-generate sort order & foldState
			foldStateController.genDefault(newData.transactions)
			sortOrderController.genDefaultSortOrder(newData.transactions)
		},
		getSortOrderController: () => sortOrderController,
		getHistoryController: () => historyController,
	})

	const foldStateController = useFoldState()

	const sortOrderController = useSortOrder({
		// move reorder logic from sortOrder to individual items
		getFoldState: foldStateController.get,
		updateFoldState: foldStateController.update,
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

	const reload = async () => {
		setIsLoading(true)
		// fetch data
	}

	const save = async () => {}

	const historyController = useHistory({
		data: dataController,
		sortOrder: sortOrderController,
	})

	// update history when event is fired, not in state functions.

	const testtest = Object.defineProperties(
		{},
		{
			test1: {
				value: 123,
				writable: false,
				enumerable: true,
			},
		}
	)

	const dashboardController = {
		data: dataController,
		sortOrder: sortOrderController,
		foldState: foldStateController,
		history: historyController,
		tiles: {
			cur: tileData,
			get curRef() {
				return curTileDataRef.current
			},
		},
	}
	dashboardController.tiles.curRef
}
