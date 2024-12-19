'use client'
import { JNumberAccounting } from '@/components/JForm'
import { useState } from 'react'
import s from './page.module.scss'

export default function Dev() {
	const [width, setWidth] = useState(200)
	return (
		<div className={s.main}>
			<div className={s.container} style={{ width: width + 'px' }}>
				<JNumberAccounting maxDigLeftOfDecimal={8} value={0} />
			</div>
			<input
				type='range'
				onChange={(e) => {
					setWidth(Number(e.target.value) * 4)
				}}
			/>
		</div>
	)
}
