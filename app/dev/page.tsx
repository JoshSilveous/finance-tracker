'use client'
import { JNumberAccounting } from '@/components/JForm'
import { useState } from 'react'

export default function Dev() {
	const [val, setVal] = useState('100.2')
	return (
		<div
			style={{
				height: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<JNumberAccounting
				value={val}
				onChange={(e) => {
					setVal(e.target.value)
					console.log('onchange fired')
				}}
				maxDigLeftOfDecimal={8}
				maxDigRightOfDecimal={2}
			/>
		</div>
	)
}
