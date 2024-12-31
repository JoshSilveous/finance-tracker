'use client'
import { JNumberAccounting } from '@/components/JForm'
import { useEffect, useRef, useState } from 'react'
import s from './page.module.scss'
import { insertTransactionAndItems } from '@/database'
import { JCheckbox } from '@/components/JForm/JCheckbox/JCheckbox'
import { Tile } from '@/components/Tile/Tile'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'

export default function Dev() {
	const testRef = useRef<HTMLInputElement | null>(null)
	const [val, setVal] = useState('0')

	const columnCount = 7
	const rowCount = 20
	const cells: JGridTypes.Cell[][] = []
	const headers: JGridTypes.Props['headers'] = [
		{
			content: <div>Col {1}</div>,
			defaultWidth: 100,
		},
		{
			content: <div>Col {2}</div>,
			defaultWidth: 100,
		},
		{
			content: <div>Col {3}</div>,
			defaultWidth: 100,
		},
		{
			content: <div>Col {4}</div>,
			defaultWidth: 100,
		},
		{
			content: <div>Col {5}</div>,
			defaultWidth: 100,
		},
		{
			content: <div>Col {6}</div>,
			defaultWidth: 100,
		},
		{
			content: <div>Col {7}</div>,
			defaultWidth: 100,
		},
	]
	for (let i = 0; i < rowCount; i++) {
		cells.push([])
		for (let j = 0; j < columnCount; j++) {
			cells[i].push(
				<div>
					<JDatePicker />
				</div>
			)
		}
	}

	console.log(cells, headers)

	const gridConfig: JGridTypes.Props = {
		cells: cells,
		headers: headers,
		useFullWidth: true,
	}

	return (
		<div className={s.main}>
			<Tile className={s.grid_container} resizable>
				<JGrid {...gridConfig} />
			</Tile>
		</div>
	)
}
