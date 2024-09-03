'use client'
import { useEffect, useState } from 'react'
import s from './AccountManager.module.scss'
import { createClient } from '@/utils/supabase/client'

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

	if (!isLoading) {
		const dataJSX = data!.map((item) => (
			<div key={item.id} className={s.item_row}>
				<div>{item.id}</div>
				<div>{item.name}</div>
				<div>{item.starting_amount}</div>
			</div>
		))
		return (
			<div>
				<div>Account Manager</div>
				{isLoading ? <div>Loading...</div> : <div>{dataJSX}</div>}
			</div>
		)
	} else {
		return <div>loading...</div>
	}
}
