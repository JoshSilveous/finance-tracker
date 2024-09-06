'use client'
import { ChangeEvent, useEffect, useState } from 'react'
import s from './AccountManager.module.scss'
import { createClient } from '@/utils/supabase/client'
import { JGrid, JGridProps } from '@/components/JGrid/JGrid'
import JNumberAccounting from '@/components/JForm/JNumberAccounting/JNumberAccounting'
import { JInput } from '@/components/JForm/JInput/JInput'
import { JButton } from '@/components/JForm/JButton/JButton'
import { default as LoadingAnim } from '@/public/loading.svg'
import { createPopup } from '@/utils/createPopup/createPopup'
import { NewAccountForm } from './NewAccountForm/NewAccountForm'
import { updateAccounts } from './updateAccounts'

interface Change {
	account_id: string
	name: {
		old: string
		new: string
		node?: EventTarget & HTMLInputElement
	}
	starting_amount: {
		old: number
		new: number
		node?: EventTarget & HTMLInputElement
	}
}

export function AccountManager() {
	const [isLoading, setIsLoading] = useState(true)
	const [data, setData] = useState<Account[]>()
	const [pendingChanges, setPendingChanges] = useState<Change[]>([])
	const [isSavingChanges, setIsSavingChanges] = useState(false)

	const supabase = createClient()

	async function fetchData() {
		setIsLoading(true)
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
		console.log(pendingChanges)
	}, [pendingChanges])

	useEffect(() => {
		fetchData()
	}, [])

	async function saveChanges() {
		// construct the Account object updates
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser()

		if (userError) {
			console.log('User error:', userError)
			return
		}

		const accountUpdates: AccountFull[] = pendingChanges.map((change) => ({
			id: change.account_id,
			name: change.name.new,
			starting_amount: change.starting_amount.new,
			user_id: user!.id,
		}))

		await updateAccounts(accountUpdates)
	}

	function handleChange(e: ChangeEvent<HTMLInputElement>) {
		// prevent leading spaces
		e.target.value = e.target.value.trimStart()

		const account_id = e.target.dataset['id'] as Account['id']
		const key = e.target.dataset['key'] as 'name' | 'starting_amount'
		const startingValue = e.target.defaultValue
		const currentValue = e.target.value

		const currentChangeIndex = pendingChanges.findIndex(
			(change) => change.account_id === account_id
		)

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

			const origData = data!.find((item) => item.id === account_id)!

			setPendingChanges((prev) => [
				...prev,
				{
					account_id: account_id,
					name: {
						old: origData.name,
						new: origData.name,
					},
					starting_amount: {
						old: origData.starting_amount,
						new: origData.starting_amount,
					},
					[key]: {
						old: origData[key],
						new:
							key === 'name'
								? currentValue.trim()
								: Math.round(parseFloat(currentValue) * 100) / 100,
						node: e.target,
					},
				},
			])
		} else {
			// if change is already present in pendingChanges
			if (pendingChanges[currentChangeIndex][key].old !== currentValue) {
				e.target.classList.add(s.changed)
			}

			setPendingChanges((prev) => {
				const newArr = [...prev]
				newArr[currentChangeIndex] = {
					...newArr[currentChangeIndex],
					[key]: {
						old: prev[currentChangeIndex][key].old,
						new:
							key === 'name'
								? currentValue.trim()
								: Math.round(parseFloat(currentValue) * 100) / 100,
						node: e.target,
					},
				}
				return newArr
			})
		}
	}

	function handleBlur(e: ChangeEvent<HTMLInputElement>) {
		e.target.value = e.target.value.trim()
		const startingValue = e.target.defaultValue
		const currentValue = e.target.value
		// handles edge case where the user just adds spaces to the end of the value
		// this will remove those spaces and the Change
		if (startingValue.trim() == currentValue.trim()) {
			e.target.classList.remove(s.changed)

			// remove change from array if needed
			const account_id = e.target.dataset['id'] as Change['account_id']
			const key = e.target.dataset['key'] as 'name' | 'starting_amount'
			const currentChangeIndex = pendingChanges?.findIndex((change) => {
				if (
					change.account_id === account_id &&
					change.name.old === change.name.new &&
					change.starting_amount.old === change.starting_amount.new
				) {
					return true
				} else {
					return false
				}
			})
			if (currentChangeIndex !== -1) {
				setPendingChanges((prev) => {
					const newArr = [...prev]
					newArr.splice(currentChangeIndex, 1)
					return newArr
				})
			}
		}
	}

	function discardChanges() {
		pendingChanges.forEach((change) => {
			if (change.name.node) {
				change.name.node.value = change.name.node.defaultValue
				change.name.node.classList.remove(s.changed)
			}
			if (change.starting_amount.node) {
				change.starting_amount.node.value = change.starting_amount.node.defaultValue
				change.starting_amount.node.classList.remove(s.changed)
			}
		})
		setPendingChanges([])
	}

	function handleCreateAccountButton() {
		const myPopup = createPopup(
			<NewAccountForm
				afterSubmit={() => {
					myPopup.close()
					fetchData()
				}}
			/>
		)
		myPopup.trigger()
	}

	if (!isLoading && data) {
		const gridHeaders = ['Account Name', 'Starting Amount']

		const gridConfig: JGridProps = {
			headers: gridHeaders.map((text) => <div className={s.header}>{text}</div>),
			content: data.map((item) => [
				<JInput
					onChange={handleChange}
					onBlur={handleBlur}
					data-id={item.id}
					data-key='name'
					defaultValue={item.name}
				/>,
				<JNumberAccounting
					onChange={handleChange}
					onBlur={handleBlur}
					data-id={item.id}
					data-key='starting_amount'
					defaultValue={item.starting_amount.toFixed(2)}
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
					<JButton
						jstyle='primary'
						className={s.create_new}
						disabled={pendingChanges.length !== 0}
						title={
							pendingChanges.length !== 0
								? 'Save or discard changes to create a new account'
								: ''
						}
						onClick={handleCreateAccountButton}
					>
						Create new account
					</JButton>
					<JButton
						jstyle='primary'
						className={s.discard}
						disabled={pendingChanges.length === 0}
						onClick={discardChanges}
					>
						Discard changes
					</JButton>
					<JButton
						jstyle='primary'
						className={s.save}
						disabled={pendingChanges.length === 0}
						loading={isSavingChanges}
						onClick={saveChanges}
					>
						Save changes
					</JButton>
				</div>
			</div>
		)
	} else {
		return (
			<div className={s.main}>
				<LoadingAnim className={s.loading_anim} />
			</div>
		)
	}
}
