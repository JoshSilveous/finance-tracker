import { SetStateAction } from 'react'
import { Tile } from '@/components/Tile/Tile'
import { SimpleValues, TransactionManager } from '../tiles'
import { Data, FoldStateController, SortOrder, HistoryController } from '../hooks'
import s from '../Dashboard.module.scss'

interface TileDataBase {
	position: {
		top: number
		left: number
	}
	size: {
		width: number
		height: number
	}
	zIndex: number
}

interface TransactionManagerTile extends TileDataBase {
	type: 'transaction_manager'
	options?: never
}
interface SimpleValuesTile extends TileDataBase {
	type: 'simple_values'
	options?: {
		exclude: string[]
		show: 'categories' | 'accounts'
	}
}

export type TileData = TransactionManagerTile | SimpleValuesTile

const tileSettings = {
	transaction_manager: {
		minWidth: 740,
		minHeight: 350,
		maxWidth: 1200,
		maxHeight: undefined,
	},
	simple_values: {
		minWidth: undefined,
		minHeight: undefined,
		maxWidth: undefined,
		maxHeight: undefined,
	},
}

export function genDisplayTiles(
	tileData: TileData[],
	setTileData: (value: SetStateAction<TileData[]>) => void,
	data: Data.Controller,
	foldState: FoldStateController,
	sortOrder: SortOrder.Controller,
	historyController: HistoryController,
	setTransactionManagerRowRef: (transaction_id: string) => (node: HTMLInputElement) => void
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
			setTileData((prev) => {
				const clone = structuredClone(prev)
				const curHighestZIndex = Math.max(...clone.map((tile) => tile.zIndex))
				clone[index].zIndex = curHighestZIndex + 1
				return clone
			})
		}

		return (
			<Tile
				className={s.transaction_manager_container}
				style={{ zIndex: tile.zIndex }}
				onMouseDown={onMouseDown}
				onResize={onResize}
				onReposition={onReposition}
				defaultWidth={tile.size.width}
				defaultHeight={tile.size.height}
				defaultPosLeft={tile.position.left}
				defaultPosTop={tile.position.top}
				{...tileSettings[tile.type]}
				key={index}
				resizable
			>
				{tile.type === 'transaction_manager' && (
					<TransactionManager
						data={data}
						foldState={foldState}
						sortOrder={sortOrder}
						historyController={historyController}
						setTransactionManagerRowRef={setTransactionManagerRowRef}
					/>
				)}
				{tile.type === 'simple_values' && (
					<SimpleValues
						data={data}
						exclude={tile.options!.exclude}
						show={tile.options!.show}
					/>
				)}
			</Tile>
		)
	})
}
