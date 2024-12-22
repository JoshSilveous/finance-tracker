'use client'
import { JNumberAccounting } from '@/components/JForm'
import { useEffect, useRef, useState } from 'react'
import s from './page.module.scss'
import { insertTransactionAndItems } from '@/database'
import { JCheckbox } from '@/components/JForm/JCheckbox/JCheckbox'

export default function Dev() {
	const testRef = useRef<HTMLInputElement | null>(null)
	const [val, setVal] = useState('0')

	useEffect(() => {
		console.log('currentRef:', testRef.current)
	}, [testRef.current, val])
	return (
		<div className={s.main}>
			<JNumberAccounting
				value={val}
				onChange={(e) => {
					setVal(e.target.value)
				}}
				ref={(node) => {
					testRef.current = node
				}}
			/>
		</div>
	)
}
