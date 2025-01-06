import { JButton } from '@/components/JForm'
import s from './AddTilePopup.module.scss'
import { createPopup } from '@/utils'
import { NewSimpleValuesPopup } from './NewSimpleValuesPopup/NewSimpleValuesPopup'
import { SetStateAction } from 'react'
import { Data } from '../hooks'
import { TileData } from '../tiles'

interface AddTilePopupProps {
	closePopup: () => void
	setTileData: (value: SetStateAction<TileData[]>) => void
	data: Data.Controller
}
export function AddTilePopup({ closePopup, setTileData, data }: AddTilePopupProps) {
	const handleNewSimpleValuesTile = () => {
		closePopup()
		const popup = createPopup(
			<NewSimpleValuesPopup
				setTileData={setTileData}
				data={data}
				closePopup={() => popup.close()}
			/>
		)
		popup.trigger()
	}
	return (
		<div className={s.main}>
			<JButton jstyle='secondary' onClick={handleNewSimpleValuesTile}>
				New "Simple Values" Tile
			</JButton>
		</div>
	)
}
