import { Tile } from '@/components/Tile/Tile'
import s from './page.module.scss'
import { TransactionManager } from './TransactionManager/TransactionManager'

export default async function Home() {
	return (
		<div className={s.main}>
			<Tile className={s.transaction_manager_container} resizable>
				<TransactionManager />
			</Tile>
		</div>
	)
}
