import { Data } from '../hooks'

interface TileDataBase {
	id: string
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

export interface TransactionManagerTile extends TileDataBase {
	type: 'transaction_manager'
	options: null
}
export interface SimpleValuesTile extends TileDataBase {
	type: 'simple_values'
	options: {
		exclude: string[]
		show: 'categories' | 'accounts'
		title: string
		showTitle: boolean
		showDataFor:
			| 'all_time'
			| 'per_week'
			| 'per_two_weeks'
			| 'per_month'
			| 'past_week'
			| 'past_two_weeks'
			| 'past_month'
		customDay: string
	}
}

export type TileDefaultSettings = {
	minWidth?: number
	minHeight?: number
	maxWidth?: number
	maxHeight?: number
	showEditButton?: boolean
	onEditButtonClick?: (
		tile: TileData,
		setTileData: (value: SetStateAction<TileData[]>) => void,
		data: Data.Controller
	) => void
}

export type TileData = TransactionManagerTile | SimpleValuesTile
