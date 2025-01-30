import { Dispatch, SetStateAction, useRef, useState } from 'react'
import { genDisplayTiles, TileData } from '../tiles'
import { GRID_SPACING } from '@/app/globals'
import { areDeeplyEqual } from '@/utils'
import { Data } from './useData'
import { FoldStateController } from './useFoldState'
import { HistoryController } from './useHistory'
import { DashboardController, SortOrder } from '.'
import { fetchTileData } from '@/database'

export function useTiles(getDashboardController: () => DashboardController) {
	const [tileData, setTileData] = useState<TileData[]>([])
	const origTileDataRef = useRef<TileData[]>([])
	const curTileDataRef = useRef<TileData[]>([])

	const [containerMaxWidth, containerMaxHeight] = (() => {
		let containerMaxWidth = 0
		let containerMaxHeight = 0

		tileData.forEach((tile) => {
			const { top, left } = tile.position
			const { width, height } = tile.size

			containerMaxWidth = Math.max(containerMaxWidth, left + width)
			containerMaxHeight = Math.max(containerMaxHeight, top + height)
		})
		return [
			`calc(${containerMaxWidth}px + (var(--GRID_SPACING) * 3))`,
			`calc(${containerMaxHeight}px + (var(--GRID_SPACING) * 3))`,
		]
	})()

	const resetPositions = () => {
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

	const changesArePending = !areDeeplyEqual(tileData, origTileDataRef.current)

	const displayElements = genDisplayTiles(
		tileData,
		origTileDataRef,
		setTileData,
		getDashboardController().data,
		getDashboardController().foldState,
		getDashboardController().sortOrder,
		getDashboardController().history
	)

	const reload = async () => {
		const tileData = await fetchTileData()
		setTileData(tileData)
		origTileDataRef.current = tileData
		curTileDataRef.current = tileData
	}

	const clearChanges = () => {
		setTileData(origTileDataRef.current)
	}

	const tileController: TileController = {
		data: {
			cur: tileData,
			get curRef() {
				return curTileDataRef.current
			},
			get origRef() {
				return origTileDataRef.current
			},
			set: setTileData,
			reload,
			clearChanges,
		},
		displayElements,
		containerMaxWidth,
		containerMaxHeight,
		resetPositions,
		changed: changesArePending,
	}

	return tileController
}

export type TileController = {
	data: {
		cur: TileData[]
		readonly curRef: TileData[]
		readonly origRef: TileData[]
		set: Dispatch<SetStateAction<TileData[]>>
		reload: () => Promise<void>
		clearChanges: () => void
	}
	displayElements: JSX.Element[]
	containerMaxWidth: string
	containerMaxHeight: string
	resetPositions: () => void
	changed: boolean
}
