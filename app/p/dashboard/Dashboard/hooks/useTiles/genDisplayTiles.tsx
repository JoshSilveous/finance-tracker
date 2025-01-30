import s from '../../Dashboard.module.scss'
import { MutableRefObject, SetStateAction } from 'react'
import { DashboardController } from '..'
import { SimpleValues } from '../../tiles/SimpleValues/SimpleValues'
import { TransactionManager } from '../../tiles/TransactionManager/TransactionManager'
import { SimpleValuesTile, TileData, TileDefaultSettings } from './types'
import { areDeeplyEqual, createPopup } from '@/utils'
import Tile from './Tile/Tile'
import { SimpleValuesSettingsPopup } from '../../tiles/SimpleValues/settings_popup/SimpleValuesSettingsPopup'

export function genDisplayTiles(
	tileData: TileData[],
	origTileDataRef: MutableRefObject<TileData[]>,
	setTileData: (value: SetStateAction<TileData[]>) => void,
	dashCtrl: DashboardController
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

		const tileDefaults: TileDefaultSettings = (() => {
			if (tile.type === 'simple_values') {
				return {
					minWidth: 180,
					minHeight: 180,
					maxWidth: undefined,
					maxHeight: undefined,
					showEditButton: true,
					onEditButtonClick: (tile, setTileData, data) => {
						const popup = createPopup({
							content: (
								<SimpleValuesSettingsPopup
									context='edit'
									tile={tile as SimpleValuesTile}
									setTileData={setTileData}
									data={data}
									closePopup={() => popup.close()}
								/>
							),
						})
						popup.trigger()
					},
				}
			} else {
				// tile.type === 'transaction_manager'
				return {
					minWidth: 740,
					minHeight: 350,
					maxWidth: 1200,
					maxHeight: undefined,
				}
			}
		})()

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
						? () =>
								tileDefaults.onEditButtonClick!(
									tile,
									setTileData,
									dashCtrl.data
								)
						: undefined
				}
				key={tile.id}
				resizable
			>
				{tile.type === 'transaction_manager' && (
					<TransactionManager dashCtrl={dashCtrl} key={`tm-${index}`} />
				)}
				{tile.type === 'simple_values' && (
					<SimpleValues
						data={dashCtrl.data}
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
