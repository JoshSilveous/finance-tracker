import s from './page.module.scss'
import { TransactionManager } from './TransactionManager/TransactionManager'

export default async function Home() {
	return (
		<div className={s.main}>
			<div className={s.transaction_manager_container}>
				<TransactionManager />
			</div>
		</div>
	)
}
