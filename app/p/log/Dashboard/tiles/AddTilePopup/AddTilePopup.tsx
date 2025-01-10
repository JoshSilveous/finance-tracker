import { JButton } from '@/components/JForm'
import s from './AddTilePopup.module.scss'
import { createPopup } from '@/utils'
import { SetStateAction } from 'react'
import { SimpleValuesSettingsPopup } from '../SimpleValues/settings_popup/SimpleValuesSettingsPopup'
import { Data } from '../../hooks/useData/useData'
import { TileData } from '..'

interface AddTilePopupProps {
	closePopup: () => void
	setTileData: (value: SetStateAction<TileData[]>) => void
	data: Data.Controller
}
export function AddTilePopup({ closePopup, setTileData, data }: AddTilePopupProps) {
	const handleNewSimpleValuesTile = () => {
		closePopup()
		const popup = createPopup(
			<SimpleValuesSettingsPopup
				context='create'
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
