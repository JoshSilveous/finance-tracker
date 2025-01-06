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
	options: null
}
interface SimpleValuesTile extends TileDataBase {
	type: 'simple_values'
	options: {
		exclude: string[]
		show: 'categories' | 'accounts'
		title: string
		showTitle: boolean
	}
}

export type TileDefaultSettings = {
	minWidth?: number
	minHeight?: number
	maxWidth?: number
	maxHeight?: number
	showEditButton?: boolean
	onEditButtonClick?: (tile: TileData) => void
}

export type TileData = TransactionManagerTile | SimpleValuesTile
