'use client'
import { JNumberAccounting } from '@/components/JForm'
import { useEffect, useRef, useState } from 'react'
import s from './page.module.scss'
import { insertTransactionAndItems } from '@/database'
import { JCheckbox } from '@/components/JForm/JCheckbox/JCheckbox'
import { Tile } from '@/components/Tile/Tile'

export default function Dev() {
	const testRef = useRef<HTMLInputElement | null>(null)
	const [val, setVal] = useState('0')

	let text = ''
	for (let i = 0; i < 1000; i++) {
		text += 'Example Content '
	}

	return (
		<div className={s.main}>
			<Tile
				onResize={(width, height) => {
					console.log(width, height)
				}}
			>
				<div className={s.content}>{text}</div>
			</Tile>
		</div>
	)
}
