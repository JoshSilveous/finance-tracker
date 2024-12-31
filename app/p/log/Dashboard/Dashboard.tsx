'use client'
import { Tile } from '@/components/Tile/Tile'
import s from './Dashboard.module.scss'
import { TransactionManager } from '../TransactionManager/TransactionManager'
import { useState } from 'react'
import { useData } from './hooks/useData/useData'

export function Dashboard() {
	const data = useData({
		onReload: (newData) => {
			// re-generate sort order & foldState
		},
	})

	return (
		<div className={s.main}>
			<button onClick={data.reload}>BUTTON</button>
			<Tile
				className={s.transaction_manager_container}
				resizable
				minWidth={740}
				maxWidth={1200}
				minHeight={350}
			>
				<TransactionManager />
			</Tile>
		</div>
	)
}
