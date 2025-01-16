import { JButton } from '@/components/JForm'
import s from './AddTilePopup.module.scss'
import { createFocusLoop, createPopup, delay } from '@/utils'
import { SetStateAction, useEffect, useLayoutEffect, useRef } from 'react'
import { SimpleValuesSettingsPopup } from '../SimpleValues/settings_popup/SimpleValuesSettingsPopup'
import { Data } from '../../hooks/useData/useData'
import { TileData } from '..'
import { FeedbackPopup } from '@/components/FeedbackPopup/FeedbackPopup'

interface AddTilePopupProps {
	closePopup: () => void
	setTileData: (value: SetStateAction<TileData[]>) => void
	data: Data.Controller
}
export function AddTilePopup({ closePopup, setTileData, data }: AddTilePopupProps) {
	const firstFocusRef = useRef<HTMLButtonElement>(null)
	const lastFocusRef = useRef<HTMLButtonElement>(null)

	useEffect(() => {
		delay(20).then(() => {
			firstFocusRef.current?.focus()
		})
	}, [])
	useEffect(() => {
		if (firstFocusRef.current && lastFocusRef.current) {
			createFocusLoop(firstFocusRef.current, lastFocusRef.current)
		}
	})

	const handleNewSimpleValuesTile = () => {
		closePopup()
		const popup = createPopup({
			content: (
				<SimpleValuesSettingsPopup
					context='create'
					setTileData={setTileData}
					data={data}
					closePopup={() => popup.close()}
				/>
			),
		})
		popup.trigger()
	}
	const suggestTile = () => {
		const popup = createPopup({
			content: (
				<FeedbackPopup
					closePopup={() => {
						popup.close()
						firstFocusRef.current!.focus()
					}}
					feedbackSource='suggest_a_tile'
					header='Suggest a tile'
				/>
			),
			handleClose: () => {
				firstFocusRef.current!.focus()
			},
		})
		popup.trigger()
	}
	return (
		<div className={s.main}>
			<h2>New Tile</h2>
			<p>
				<strong>Dashboard Tiles</strong> allow you to customize your dashboard by
				displaying the data most relevant to your finance system.
			</p>
			<div className={s.add_button_container}>
				<JButton
					jstyle='primary'
					onClick={handleNewSimpleValuesTile}
					ref={firstFocusRef}
				>
					New "Simple Values" Tile
				</JButton>
				<JButton jstyle='secondary' disabled onClick={handleNewSimpleValuesTile}>
					New Graph Tile (work in progress)
				</JButton>
				<JButton jstyle='secondary' disabled onClick={handleNewSimpleValuesTile}>
					New Pie Chart Tile (work in progress)
				</JButton>
				<JButton jstyle='primary' onClick={suggestTile}>
					Suggest a Tile
				</JButton>
			</div>
			<div className={s.bottom_button_container}>
				<JButton jstyle='secondary' onClick={closePopup} ref={lastFocusRef}>
					Go Back
				</JButton>
			</div>
		</div>
	)
}
