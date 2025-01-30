import Tile from '@/components/Tile/Tile'
import s from '../Dashboard.module.scss'
import { MutableRefObject, SetStateAction } from 'react'
import { Data, FoldStateController, SortOrder, HistoryController } from '../hooks'
import { SimpleValues, simpleValuesTileDefaults } from './SimpleValues/SimpleValues'
import {
	TransactionManager,
	transactionManagerTileDefaults,
} from './TransactionManager/TransactionManager'
import { TileData } from './types'
import { areDeeplyEqual } from '@/utils'

export function genDisplayTiles(
	tileData: TileData[],
	origTileDataRef: MutableRefObject<TileData[]>,
	setTileData: (value: SetStateAction<TileData[]>) => void,
	data: Data.Controller,
	foldState: FoldStateController,
	sortOrder: SortOrder.Controller,
	historyController: HistoryController
) {
	return tileData.map((tile, index) => {
		const onResize = (width: number, height: number) => {
			setTileData((prev) => {
				const clone = structuredClone(prev)
				clone[index].size = { width, height }
				return clone
			})
		}
		const onReposition = (top: number, left: number) => {
			setTileData((prev) => {
				const clone = structuredClone(prev)
				clone[index].position = { top, left }
				return clone
			})
		}
		const onMouseDown = () => {
			if (tile.zIndex !== tileData.length) {
				setTileData((prev) => {
					const clone = structuredClone(prev)
					clone.forEach((tile) => {
						tile.zIndex = tile.zIndex > 1 ? tile.zIndex - 1 : tile.zIndex
					})
					clone[index].zIndex = clone.length
					return clone
				})
			}
		}

		const changed = (() => {
			// if new tile
			if (origTileDataRef.current![index] === undefined) {
				return true
			}

			// check for changes to this tile BESIDES zIndex. zIndex changes quite often, and isn't really important enough to notify the user that it'll need to be saved.
			const origTileWithoutZIndex = (() => {
				const { zIndex, ...rest } = origTileDataRef.current![index]
				return rest
			})()
			const curTileWithoutZIndex = (() => {
				const { zIndex, ...rest } = tile
				return rest
			})()

			return !areDeeplyEqual(origTileWithoutZIndex, curTileWithoutZIndex)
		})()

		const tileDefaults =
			tile.type === 'simple_values'
				? simpleValuesTileDefaults
				: transactionManagerTileDefaults

		return (
			<Tile
				className={s.tile}
				style={{ zIndex: tile.zIndex }}
				onMouseDown={onMouseDown}
				onResize={onResize}
				onReposition={onReposition}
				defaultWidth={tile.size.width}
				defaultHeight={tile.size.height}
				defaultPosLeft={tile.position.left}
				defaultPosTop={tile.position.top}
				{...tileDefaults}
				onEditButtonClick={
					tileDefaults.onEditButtonClick !== undefined
						? () => tileDefaults.onEditButtonClick!(tile, setTileData, data)
						: undefined
				}
				key={tile.id}
				resizable
			>
				{tile.type === 'transaction_manager' && (
					<TransactionManager
						data={data}
						foldState={foldState}
						sortOrder={sortOrder}
						historyController={historyController}
						key={`tm-${index}`}
					/>
				)}
				{tile.type === 'simple_values' && (
					<SimpleValues
						data={data}
						changed={changed}
						tileOptions={tile.options!}
						tileID={tile.id}
						key={`sv-${index}`}
					/>
				)}
			</Tile>
		)
	})
}
