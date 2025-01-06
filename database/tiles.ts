'use client'
import { TileData } from '@/app/p/log/Dashboard/tiles'
import { createClient, getUserID } from '@/database/supabase/client'

const supabase = createClient()

export async function fetchTileData() {
	const { data, error } = await supabase
		.from('tiles')
		.select('id, top, left, height, width, type, options, zIndex')

	if (error) {
		throw new Error(error.message)
	}
	const structuredData: TileData[] = data.map((tile) => ({
		id: tile.id,
		type: tile.type,
		zIndex: tile.zIndex,
		position: { top: tile.top, left: tile.left },
		size: { width: tile.width, height: tile.height },
		options: tile.options,
	}))
	return structuredData
}
