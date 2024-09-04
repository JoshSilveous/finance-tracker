'use client'
import { ChangeEvent, useEffect, useState } from 'react'
import s from './AccountManager.module.scss'
import { createClient } from '@/utils/supabase/client'
import { JGrid, JGridProps } from '@/components/JGrid/JGrid'
import JNumberAccounting from '@/components/JForm/JNumberAccounting/JNumberAccounting'
import { JInput } from '@/components/JForm/JInput/JInput'
import { JButton } from '@/components/JForm/JButton/JButton'

interface AccountData {
	id: string
	name: string
	starting_amount: number
}

interface Change {
	account_id: string
	key: 'name' | 'starting_amount'
	newVal: string | number
}

export function AccountManager() {
	const [isLoading, setIsLoading] = useState(true)
	const [data, setData] = useState<AccountData[]>()
	const [pendingChanges, setPendingChanges] = useState<Change[]>([])

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

	function handleChange(e: ChangeEvent<HTMLInputElement>) {
		console.log('updating with following info:')
		const account_id = e.target.dataset['id'] as Change['account_id']
		const key = e.target.dataset['key'] as Change['key']
		const startingValue = e.target.defaultValue
		const currentValue = e.target.value

		const currentChangeIndex = pendingChanges?.findIndex((change) => {
			if (change.account_id === account_id && change.key === key) {
				return true
			} else {
				return false
			}
		})
		console.log('currentChangeIndex', currentChangeIndex)

		if (startingValue == currentValue) {
			// if new val equals starting value, remove change item and class
			e.target.classList.remove(s.changed)
			if (currentChangeIndex !== -1) {
				setPendingChanges((prev) => {
					const newArr = [...prev]
					newArr.splice(currentChangeIndex, 1)
					return newArr
				})
			}
		} else if (currentChangeIndex === -1) {
			// if change isn't already present in pendingChanges
			e.target.classList.add(s.changed)
			setPendingChanges((prev) => [
				...prev,
				{
					account_id: account_id,
					key: key,
					newVal: currentValue,
				},
			])
		} else {
			// if change is already present in pendingChanges
			setPendingChanges((prev) => {
				const newArr = [...prev]
				newArr[currentChangeIndex] = {
					account_id: account_id,
					key: key,
					newVal: currentValue,
				}
				return newArr
			})
		}
	}
	useEffect(() => {
		console.log(pendingChanges)
	}, [pendingChanges])

	if (!isLoading && data) {
		const gridHeaders = ['Account Name', 'Starting Amount']

		const gridConfig: JGridProps = {
			headers: gridHeaders.map((text) => <div className={s.header}>{text}</div>),
			content: data.map((item) => [
				<JInput
					onChange={handleChange}
					data-id={item.id}
					data-key='name'
					defaultValue={item.name}
				/>,
				<JNumberAccounting
					onChange={handleChange}
					data-id={item.id}
					data-key='starting_amount'
					defaultValue={item.starting_amount}
				/>,
			]),
			defaultColumnWidths: ['122px', '133px'],
		}

		return (
			<div className={s.main}>
				<h2>Account Manager</h2>
				<div className={s.jgrid_container}>
					<JGrid {...gridConfig} className={s.jgrid} />
				</div>
				<div className={s.buttons_container}>
					<JButton jstyle='primary' className={s.create_new}>
						Create new account
					</JButton>
					<JButton
						jstyle='primary'
						className={s.discard}
						disabled={pendingChanges.length === 0}
					>
						Discard changes
					</JButton>
					<JButton
						jstyle='primary'
						className={s.save}
						disabled={pendingChanges.length === 0}
					>
						Save changes
					</JButton>
				</div>
			</div>
		)
	} else {
		return <div className={s.main}>loading...</div>
	}
}
