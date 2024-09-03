'use client'
import { useEffect, useState } from 'react'
import s from './AccountManager.module.scss'
import { createClient } from '@/utils/supabase/client'
import { JGrid, JGridProps } from '@/components/JGrid/JGrid'

interface AccountData {
	id: string
	name: string
	starting_amount: number
}

export function AccountManager() {
	const [isLoading, setIsLoading] = useState(true)
	const [data, setData] = useState<AccountData[]>()

	const supabase = createClient()

	async function fetchData() {
		const { data, error } = await supabase
			.from('accounts')
			.select('id, name, starting_amount')
		if (error) {
			console.log('error!', error)
		} else {
			setData(data)
			setIsLoading(false)
		}
	}

	useEffect(() => {
		fetchData()
	}, [])

	if (!isLoading && data) {
		const gridHeaders = ['Account Name', 'Starting Amount']

		const gridConfig: JGridProps = {
			headers: gridHeaders.map((text) => <div className={s.header}>{text}</div>),
			content: data.map((item) => [
				<div data-id={item.id} className={s.cell}>
					{item.name}
				</div>,
				<div data-id={item.id}>{item.starting_amount}</div>,
			]),
			defaultColumnWidths: ['250px', '150px'],
			noOuterBorders: true,
		}

		return (
			<div>
				<div>Account Manager</div>
				{isLoading ? (
					<div>Loading...</div>
				) : (
					<div className={s.jgrid_container}>
						<JGrid {...gridConfig} className={s.jgrid} />
					</div>
				)}
			</div>
		)
	} else {
		return <div>loading...</div>
	}
}
