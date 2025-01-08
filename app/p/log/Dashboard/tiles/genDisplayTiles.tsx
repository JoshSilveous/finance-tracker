import Tile from '@/components/Tile/Tile'
import s from '../Dashboard.module.scss'
import { SetStateAction } from 'react'
import { Data, FoldStateController, SortOrder, HistoryController } from '../hooks'
import { SimpleValues, simpleValuesTileDefaults } from './SimpleValues/SimpleValues'
import {
	TransactionManager,
	transactionManagerTileDefaults,
} from './TransactionManager/TransactionManager'
import { TileData } from './types'

export function genDisplayTiles(
	tileData: TileData[],
	setTileData: (value: SetStateAction<TileData[]>) => void,
	data: Data.Controller,
	foldState: FoldStateController,
	sortOrder: SortOrder.Controller,
	historyController: HistoryController,
	setTransactionManagerRowRef: (
		transaction_id: string
	) => (node: HTMLInputElement) => void,
	changesArePending: boolean,
	handleSave: () => Promise<void>
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

		const tileDefaults =
			tile.type === 'simple_values'
				? simpleValuesTileDefaults
				: transactionManagerTileDefaults

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
				{...tileDefaults}
				onEditButtonClick={
					tileDefaults.onEditButtonClick !== undefined
						? () => tileDefaults.onEditButtonClick!(tile, setTileData, data)
						: undefined
				}
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
						key={`tm-${index}`}
						changesArePending={changesArePending}
						handleSave={handleSave}
					/>
				)}
				{tile.type === 'simple_values' && (
					<SimpleValues
						data={data}
						tileOptions={tile.options!}
						tileID={tile.id}
						key={`sv-${index}`}
					/>
				)}
			</Tile>
		)
	})
}
