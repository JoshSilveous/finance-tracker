'use client'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import s from './TransactionManager.module.scss'
import { fetchData } from './func/clientFunctions'
import { isStandardError, promptError } from '@/utils'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
export function TransactionManager() {
	const [data, setData] = useState<Transaction.Full[] | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	async function loadData() {
		try {
			const data = await fetchData()
			setData(data)
			setIsLoading(false)
		} catch (e) {
			if (isStandardError(e)) {
				promptError(
					'An unexpected error has occurred while fetching your transaction data from the database:',
					e.message,
					'Try refreshing the page to resolve this issue.'
				)
			}
		}
	}
	useEffect(() => {
		loadData()
	}, [])

	let grid: ReactNode
	const gridHeaders: JGridTypes.Header[] = useMemo(
		() => [
			{
				content: <></>,
				defaultWidth: 55,
				noResize: true,
			},
			{
				content: (
					<div className={s.header_container}>
						<div className={s.header}>Transaction Name</div>
					</div>
				),
				defaultWidth: 150,
				minWidth: 100,
				maxWidth: 330,
			},
			{
				content: (
					<div className={s.header_container}>
						<div className={s.header}>Date</div>
					</div>
				),
				defaultWidth: 150,
				minWidth: 100,
				maxWidth: 330,
			},
			{
				content: (
					<div className={s.header_container}>
						<div className={s.header}>Amount</div>
					</div>
				),
				defaultWidth: 150,
				minWidth: 100,
				maxWidth: 330,
			},
			{
				content: (
					<div className={s.header_container}>
						<div className={s.header}>Category</div>
					</div>
				),
				defaultWidth: 150,
				minWidth: 100,
				maxWidth: 330,
			},
			{
				content: (
					<div className={s.header_container}>
						<div className={s.header}>Account</div>
					</div>
				),
				defaultWidth: 150,
				minWidth: 100,
				maxWidth: 330,
			},
		],
		[]
	)
	if (!isLoading && data !== null) {
		if (data.length === 0) {
			grid = (
				<p>
					You do not have any categories, click "Create new category" below to get
					started!
				</p>
			)
		} else {
			const cells: JGridTypes.Props['cells'] = data.map((transaction) => {
				if (transaction.items.length === 1) {
					return [
						{ content: <div>CTRL</div> },
						{ content: <div>{transaction.name}</div> },
						{ content: <div>{transaction.date}</div> },
						{ content: <div>{transaction.items[0].amount}</div> },
						{ content: <div>{transaction.items[0].category_id}</div> },
						{ content: <div>{transaction.items[0].account_id}</div> },
					]
				} else {
					return [{ content: <></> }]
				}
			})
			const gridConfig: JGridTypes.Props = {
				headers: gridHeaders,
				cells: cells,
			}
			grid = <JGrid {...gridConfig} />
		}
	}
	return (
		<div>
			TransactionManager
			<br />
			Data:
			<br />
			{isLoading ? 'Loading...' : grid}
		</div>
	)
}
