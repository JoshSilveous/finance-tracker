'use client'
import { Tile } from '@/components/Tile/Tile'
import s from './Dashboard.module.scss'
import { TransactionManager } from '../TransactionManager/TransactionManager'

export function Dashboard() {
	return (
		<div className={s.main}>
			<Tile className={s.transaction_manager_container} resizable>
				<TransactionManager />
			</Tile>
		</div>
	)
}
