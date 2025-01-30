import { useState } from 'react'
import { FoldStateController, useFoldState } from './useFoldState'
import { HistoryController, useHistory } from './useHistory'
import { SortOrder, useSortOrder } from './useSortOrder'
import { Data, TileController, useData, useTiles } from '.'
import { saveChanges } from '../func/saveChanges'
import { areDeeplyEqual } from '@/utils'

export function useDashboardController() {
	const [isLoading, setIsLoading] = useState(true)

	const reloadAll = async () => {
		setIsLoading(true)
		await Promise.all([dataController.reload(), tileController.data.reload()])
		setIsLoading(false)
	}

	const save = async () => {
		setIsLoading(true)
		await saveChanges(dashboardController)
		setIsLoading(false)
	}

	const discard = () => {
		dataController.clearChanges()
		tileController.data.clearChanges()
		sortOrderController.discardChanges()
	}

	const dashboardController: DashboardController = {
		get data() {
			return dataController
		},
		get sortOrder() {
			return sortOrderController
		},
		get foldState() {
			return foldStateController
		},
		get history() {
			return historyController
		},
		get tiles() {
			return tileController
		},
		reloadAll,
		save,
		discard,
		get changesArePending() {
			if (dataController.isPendingSave) {
				// covers actual data changes
				return true
			}
			if (!areDeeplyEqual(sortOrderController.cur, sortOrderController.def)) {
				// covers sort order
				return true
			}
			// check differences in tiles
			if (tileController.changed) {
				return true
			}
			return false
		},
		loading: isLoading,
	}

	const dataController = useData(() => dashboardController)
	const foldStateController = useFoldState()
	const sortOrderController = useSortOrder(() => dashboardController)
	const historyController = useHistory(() => dashboardController)
	const tileController = useTiles(() => dashboardController)

	return dashboardController
}

export type DashboardController = {
	data: Data.Controller
	sortOrder: SortOrder.Controller
	foldState: FoldStateController
	history: HistoryController
	tiles: TileController
	reloadAll: () => Promise<void>
	save: () => Promise<void>
	discard: () => void
	changesArePending: boolean
	loading: boolean
}
