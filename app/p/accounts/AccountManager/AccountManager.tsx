'use client'
import { ChangeEvent, useEffect, useState } from 'react'
import s from './AccountManager.module.scss'
import { ColumnResizeEventHandler, JGrid, JGridProps } from '@/components/JGrid/JGrid'
import { JButton, JInput, JNumberAccounting } from '@/components/JForm'
import { default as LoadingAnim } from '@/public/loading.svg'
import { NewAccountForm } from './NewAccountForm/NewAccountForm'
import {
	removeFromArray,
	createPopup,
	isStandardError,
	createPreferencesEntry,
	createErrorPopup,
} from '@/utils'
import {
	updatePreferredColumnWidth,
	fetchData,
	fetchPreferredColumnWidths,
	upsertData,
} from './clientFunctions'

interface Change {
	account_id: string
	new: {
		name?: string
		starting_amount?: string
	}
}

export function AccountManager() {
	const [isLoading, setIsLoading] = useState(true)
	const [defaultColumnWidths, setDefaultColumnWidths] = useState<string[] | null>(null)
	const [data, setData] = useState<Account[]>()
	const [pendingChanges, setPendingChanges] = useState<Change[]>([])
	const [isSavingChanges, setIsSavingChanges] = useState(false)

	async function loadInitData() {
		setIsLoading(true)
		try {
			const columnWidths = await fetchPreferredColumnWidths()
			setDefaultColumnWidths([
				`${columnWidths.account_name_width}px`,
				`${columnWidths.starting_amount_width}px`,
			])
		} catch (e) {
			if (isStandardError(e)) {
				if (e.message === 'Preferences not found!') {
					try {
						await createPreferencesEntry()
						const columnWidths = await fetchPreferredColumnWidths()
						setDefaultColumnWidths([
							`${columnWidths.account_name_width}px`,
							`${columnWidths.starting_amount_width}px`,
						])
					} catch (e) {
						if (isStandardError(e)) {
							createErrorPopup(e.message)
						}
					}
				} else {
					createErrorPopup(e.message)
				}
			}
		}
		try {
			const data = await fetchData()
			setData(data)
			setIsLoading(false)
		} catch (e) {
			if (isStandardError(e)) {
				createErrorPopup(e.message)
			} else {
				console.error(e)
			}
		}
	}

	useEffect(() => {
		loadInitData()
	}, [])

	async function saveChanges() {
		setIsSavingChanges(true)

		const accountUpdates: Account[] = pendingChanges.map((change) => {
			const thisAccount = data!.find(
				(item) => item.id === change.account_id
			) as Account
			return {
				id: change.account_id,
				name: change.new.name === undefined ? thisAccount.name : change.new.name,
				starting_amount:
					change.new.starting_amount === undefined
						? thisAccount.starting_amount
						: Math.round(parseFloat(change.new.starting_amount) * 100) / 100,
			}
		})
		try {
			await upsertData(accountUpdates)
		} catch (e) {
			if (isStandardError(e)) {
				createErrorPopup(e.message)
			} else {
				console.error(e)
			}
		}

		setIsLoading(true)
		const data = await fetchData()
		setData(data)
		setIsLoading(false)
		setIsSavingChanges(false)
		setPendingChanges([])
	}

	function handleChange(e: ChangeEvent<HTMLInputElement>) {
		// prevent leading spaces
		if (e.target.value !== e.target.value.trimStart()) {
			e.target.value = e.target.value.trimStart()
		}

		const account_id = e.target.dataset['id'] as Account['id']
		const key = e.target.dataset['key'] as keyof Change['new']
		const startingValue = e.target.defaultValue
		const currentValue = e.target.value

		const currentChangeIndex = pendingChanges.findIndex(
			(change) => change.account_id === account_id
		)

		if (startingValue === currentValue) {
			// if new val equals starting value, remove change item and class
			e.target.parentElement!.classList.remove(s.changed)

			const thisChange = pendingChanges[currentChangeIndex]
			if (thisChange === undefined) {
				return
			}

			if (Object.keys(thisChange.new).length > 1) {
				// remove this key from thisChange.new
				setPendingChanges((prev) => {
					const newArr = [...prev]
					delete newArr[currentChangeIndex].new[key]
					return newArr
				})
			} else {
				// remove thisChange from pendingChanges
				setPendingChanges((prev) => removeFromArray(prev, currentChangeIndex))
			}
		} else if (currentChangeIndex === -1) {
			// if change isn't already present in pendingChanges
			e.target.parentElement!.classList.add(s.changed)
			setPendingChanges((prev) => [
				...prev,
				{
					account_id,
					new: { [key]: currentValue },
				},
			])
		} else {
			// if change is already present in pendingChanges
			e.target.parentElement!.classList.add(s.changed)
			setPendingChanges((prev) => {
				const newArr = [...prev]
				newArr[currentChangeIndex].new[key] = currentValue
				return newArr
			})
		}
	}

	function handleBlur(e: ChangeEvent<HTMLInputElement>) {
		e.target.value = e.target.value.trimEnd()
		const startingValue = e.target.defaultValue
		const currentValue = e.target.value
		// handles edge case where the user just adds spaces to the end of the value
		// this will remove those spaces and the Change
		if (startingValue === currentValue) {
			e.target.parentElement!.classList.remove(s.changed)
			const account_id = e.target.dataset['id'] as Account['id']
			const key = e.target.dataset['key'] as keyof Change['new']

			const currentChangeIndex = pendingChanges.findIndex(
				(change) => change.account_id === account_id
			)
			const thisChange = pendingChanges[currentChangeIndex]
			if (thisChange === undefined) {
				return
			}

			if (Object.keys(thisChange.new).length > 1) {
				// remove this key from thisChange.new
				setPendingChanges((prev) => {
					const newArr = [...prev]
					delete newArr[currentChangeIndex].new[key]
					return newArr
				})
			} else {
				// remove thisChange from pendingChanges
				setPendingChanges((prev) => removeFromArray(prev, currentChangeIndex))
			}
		}
	}

	function discardChanges() {
		const changedContainers = document.querySelectorAll(
			`.${s.changed}`
		) as NodeListOf<HTMLDivElement>
		const changedInputs = document.querySelectorAll(
			`.${s.changed} > input`
		) as NodeListOf<HTMLInputElement>
		changedContainers.forEach((node) => {
			node.classList.remove(s.changed)
		})
		changedInputs.forEach((node) => {
			node.value = node.defaultValue
			node.focus()
			node.blur()
		})
		setPendingChanges([])
	}

	function handleCreateAccountButton() {
		const myPopup = createPopup(
			<NewAccountForm
				afterSubmit={async () => {
					myPopup.close()
					setIsLoading(true)
					const data = await fetchData()
					setData(data)
					setIsLoading(false)
				}}
			/>
		)
		myPopup.trigger()
	}

	const gridHeaders = ['Account Name', 'Starting Amount']

	const updateDefaultColumnWidth: ColumnResizeEventHandler = async (e) => {
		await updatePreferredColumnWidth(e.columnIndex, e.newWidth)
	}

	let gridConfig: JGridProps | undefined

	if (!isLoading && data) {
		gridConfig = {
			headers: gridHeaders.map((text) => <div className={s.header}>{text}</div>),
			content: data.map((item) => [
				<JInput
					onChange={handleChange}
					onBlur={handleBlur}
					className={s.account_name_input}
					data-id={item.id}
					data-key='name'
					defaultValue={item.name}
				/>,
				<JNumberAccounting
					onChange={handleChange}
					onBlur={handleBlur}
					className={s.starting_amount_input}
					data-id={item.id}
					data-key='starting_amount'
					defaultValue={item.starting_amount.toFixed(2)}
				/>,
			]),
			defaultColumnWidths: defaultColumnWidths
				? defaultColumnWidths
				: ['122px', '133px'],
			onResize: updateDefaultColumnWidth,
		}
	}

	return (
		<div className={s.main}>
			<h2>Account Manager</h2>
			<div className={s.jgrid_container}>
				{isLoading ? (
					<LoadingAnim className={s.loading_anim} />
				) : (
					<JGrid {...gridConfig!} className={s.jgrid} />
				)}
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
}
