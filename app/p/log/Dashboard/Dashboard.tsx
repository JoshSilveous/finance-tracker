'use client'
import { Tile } from '@/components/Tile/Tile'
import s from './Dashboard.module.scss'
import { TransactionManager } from '../TransactionManager/TransactionManager'
import { useState } from 'react'

export function Dashboard() {
	const [data, setData] = useState()

	return (
		<div className={s.main}>
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
