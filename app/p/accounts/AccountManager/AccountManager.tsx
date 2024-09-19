'use client'
import { ChangeEvent, ReactNode, useEffect, useRef, useState } from 'react'
import s from './AccountManager.module.scss'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import { JButton, JInput, JNumberAccounting } from '@/components/JForm'
import { default as LoadingAnim } from '@/public/loading.svg'
import { NewAccountForm } from './NewAccountForm/NewAccountForm'
import {
	removeFromArray,
	createPopup,
	isStandardError,
	createPreferencesEntry,
	createErrorPopup,
	useBgLoad,
	arraysAreEqual,
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
	const bgLoad = useBgLoad()
	const [isLoading, setIsLoading] = useState(true)
	const [defaultColumnWidths, setDefaultColumnWidths] = useState<number[] | null>(null)
	const [data, setData] = useState<Account.Full[]>()
	const [isSavingChanges, setIsSavingChanges] = useState(false)
	const [pendingChanges, setPendingChanges] = useState<Change[]>([])
	const [sortOrder, setSortOrder] = useState<Account.ID[] | null>(null)
	const [defaultSortOrder, setDefaultSortOrder] = useState<Account.ID[] | null>(null)

	/**
	 * use instead of `pendingChanges` in event listeners to ensure you're pulling the latest data
	 */
	const pendingChangesRef = useRef<Change[]>(pendingChanges)
	useEffect(() => {
		pendingChangesRef.current = pendingChanges
	}, [pendingChanges])

	/**
	 * used to enable/disable "save" buttons and functions, since there's two different types of changes to be saved
	 *
	 * (data changes in `pendingChanges`, and changes to `sortOrder`)
	 */
	const saveOptionIsAvailable =
		pendingChanges.length !== 0 ||
		(sortOrder !== null &&
			defaultSortOrder !== null &&
			!arraysAreEqual(sortOrder, defaultSortOrder))

	async function loadInitData() {
		setIsLoading(true)
		try {
			const columnWidths = await fetchPreferredColumnWidths()
			setDefaultColumnWidths([
				columnWidths.account_name_width,
				columnWidths.starting_amount_width,
			])
		} catch (e) {
			if (isStandardError(e)) {
				if (e.message === 'Preferences not found!') {
					try {
						await createPreferencesEntry()
						const columnWidths = await fetchPreferredColumnWidths()
						setDefaultColumnWidths([
							columnWidths.account_name_width,
							columnWidths.starting_amount_width,
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
			const sortOrder = data.map((item) => item.id)
			setSortOrder(sortOrder)
			setDefaultSortOrder(sortOrder)
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

		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [])

	let grid: ReactNode

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.ctrlKey && e.key === 's') {
			e.preventDefault()
			saveChanges()
		}
	}
	const saveChanges = async () => {
		const pendingChanges = pendingChangesRef.current
		if (saveOptionIsAvailable) {
			setIsSavingChanges(true)

			// apply data changes
			const accountUpdates: Account.WithPropsAndID[] = pendingChanges.map((change) => {
				const thisAccount = data!.find(
					(item) => item.id === change.account_id
				) as Account.Full
				return {
					id: change.account_id,
					name: change.new.name === undefined ? thisAccount.name : change.new.name,
					order_position: thisAccount.order_position,
					starting_amount:
						change.new.starting_amount === undefined
							? thisAccount.starting_amount
							: Math.round(parseFloat(change.new.starting_amount) * 100) / 100,
				}
			})

			// apply re-ordering
			sortOrder!.forEach((sortAccountID, sortIndex) => {
				if (defaultSortOrder![sortIndex] !== sortAccountID) {
					const thisUpdate = accountUpdates.find(
						(update) => update.id === sortAccountID
					)
					if (thisUpdate === undefined) {
						const thisAccount = data!.find((item) => item.id === sortAccountID)!
						accountUpdates.push({
							id: sortAccountID,
							name: thisAccount.name,
							starting_amount: thisAccount.starting_amount,
							order_position: sortIndex,
						})
					} else {
						thisUpdate.order_position = sortIndex
					}
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

			loadInitData()
			setIsSavingChanges(false)
			setPendingChanges([])
		}
	}
	const discardChanges = () => {
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
		setSortOrder(defaultSortOrder)
		setPendingChanges([])
	}

	const handleCreateAccountButton = () => {
		const myPopup = createPopup(
			<NewAccountForm
				afterSubmit={async () => {
					myPopup.close()
					loadInitData()
				}}
			/>
		)
		myPopup.trigger()
	}
	if (!isLoading && data && sortOrder && defaultColumnWidths) {
		const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
			// prevent leading spaces
			if (e.target.value !== e.target.value.trimStart()) {
				e.target.value = e.target.value.trimStart()
			}

			const account_id = e.target.dataset['id'] as Account.ID
			const key = e.target.dataset['key'] as keyof Change['new']
			const defaultValue = e.target.dataset['default'] as string
			const currentValue = e.target.value

			const thisPendingChangeIndex = pendingChanges.findIndex(
				(change) => change.account_id === account_id
			)
			const thisPendingChange =
				thisPendingChangeIndex !== -1
					? pendingChanges[thisPendingChangeIndex]
					: undefined

			if (defaultValue === currentValue) {
				// if new val equals starting value, remove change item

				if (thisPendingChange === undefined) {
					return
				}

				if (Object.keys(thisPendingChange.new).length > 1) {
					// remove this key from thisChange.new
					setPendingChanges((prev) => {
						const newArr = structuredClone(prev)
						delete newArr[thisPendingChangeIndex].new[key]
						return newArr
					})
				} else {
					// remove thisChange from pendingChanges
					setPendingChanges((prev) =>
						removeFromArray(prev, thisPendingChangeIndex)
					)
				}
			} else if (thisPendingChangeIndex === -1) {
				// if change isn't already present in pendingChanges
				setPendingChanges((prev) => [
					...prev,
					{
						account_id,
						new: { [key]: currentValue },
					},
				])
			} else {
				// if change is already present in pendingChanges
				setPendingChanges((prev) => {
					const newArr = [...prev]
					newArr[thisPendingChangeIndex].new[key] = currentValue
					return newArr
				})
			}
		}
		const handleBlur = (e: ChangeEvent<HTMLInputElement>) => {
			e.target.value = e.target.value.trimEnd()
			const defaultValue = e.target.dataset['default'] as string
			const currentValue = e.target.value
			// handles edge case where the user just adds spaces to the end of the value
			// this will remove those spaces and the Change
			if (defaultValue === currentValue) {
				const account_id = e.target.dataset['id'] as Account.ID
				const key = e.target.dataset['key'] as keyof Change['new']

				const thisPendingChangeIndex = pendingChanges.findIndex(
					(change) => change.account_id === account_id
				)
				const thisPendingChange = pendingChanges[thisPendingChangeIndex]
				if (thisPendingChange?.new[key] === undefined) {
					return
				} else {
					if (Object.keys(thisPendingChange.new).length >= 1) {
						// remove this key from thisChange.new
						setPendingChanges((prev) => {
							const newArr = structuredClone(prev)
							delete newArr[thisPendingChangeIndex].new[key]
							return newArr
						})
					} else {
						// remove thisChange from pendingChanges
						setPendingChanges((prev) =>
							removeFromArray(prev, thisPendingChangeIndex)
						)
					}
				}
			}
		}
		const updateDefaultColumnWidth: JGridTypes.ColumnResizeEventHandler = async (e) => {
			bgLoad.start()
			try {
				await updatePreferredColumnWidth(e.columnIndex - 1, e.newWidth)
			} catch (e) {
				if (isStandardError(e)) {
					console.error(
						`Minor error occured when updating preferredColumnWidth: ${e.message}`
					)
				}
			}
			bgLoad.stop()
		}
		const headers: JGridTypes.Header[] = [
			{
				content: <div className={s.header}>#</div>,
				defaultWidth: 40,
				noResize: true,
			},
			{
				content: <div className={s.header}>Account Name</div>,
				defaultWidth: defaultColumnWidths[0],
				minWidth: 100,
				maxWidth: 230,
			},
			{
				content: <div className={s.header}>Starting Amount</div>,
				defaultWidth: defaultColumnWidths[1],
				minWidth: 100,
				maxWidth: 230,
			},
		]
		const gridConfig = {
			headers: headers,
			content: sortOrder.map((sortId, sortIndex) => {
				const thisData = data.find((item) => item.id === sortId)!
				const thisPendingChangeIndex = pendingChanges.findIndex(
					(change) => change.account_id === sortId
				)
				const thisPendingChange =
					thisPendingChangeIndex === -1
						? null
						: pendingChanges[thisPendingChangeIndex]

				function moveUp() {
					setSortOrder((prev) => {
						const newArr = [...prev!]
						newArr[sortIndex] = prev![sortIndex - 1]
						newArr[sortIndex - 1] = prev![sortIndex]
						return newArr
					})
				}
				function moveDown() {
					setSortOrder((prev) => {
						const newArr = [...prev!]
						newArr[sortIndex] = prev![sortIndex + 1]
						newArr[sortIndex + 1] = prev![sortIndex]
						return newArr
					})
				}

				return [
					<div
						key={`1-${thisData.id}`}
						className={`${s.reorder_container} ${
							sortId !== defaultSortOrder![sortIndex] ? s.changed : ''
						}`}
					>
						{sortIndex !== 0 && (
							<div className={s.up} onClick={moveUp}>
								↑
							</div>
						)}
						{sortIndex !== data.length - 1 && (
							<div className={s.down} onClick={moveDown}>
								↓
							</div>
						)}
					</div>,
					<JInput
						key={`2-${thisData.id}`}
						onChange={handleChange}
						onBlur={handleBlur}
						className={`${s.account_name_input} ${
							thisPendingChange?.new.name ? s.changed : ''
						}`}
						data-id={thisData.id}
						data-key='name'
						data-default={thisData.name}
						value={
							thisPendingChange?.new.name
								? thisPendingChange.new.name
								: thisData.name
						}
					/>,
					<JNumberAccounting
						key={`3-${thisData.id}`}
						onChange={handleChange}
						onBlur={handleBlur}
						className={`${s.account_name_input} ${
							thisPendingChange?.new.starting_amount ? s.changed : ''
						}`}
						data-id={thisData.id}
						data-key='starting_amount'
						data-default={thisData.starting_amount.toFixed(2)}
						value={
							thisPendingChange?.new.starting_amount
								? thisPendingChange.new.starting_amount
								: thisData.starting_amount
						}
					/>,
				]
			}),
			maxTableWidth: 500,
			onResize: updateDefaultColumnWidth,
			minColumnWidth: 30,
		}
		grid = <JGrid {...gridConfig!} className={s.jgrid} />
	}

	return (
		<div className={s.main}>
			<h2>Account Manager</h2>
			<div className={s.jgrid_container}>
				{isLoading ? <LoadingAnim className={s.loading_anim} /> : grid}
			</div>
			<div className={s.buttons_container}>
				<JButton
					jstyle='primary'
					className={s.create_new}
					disabled={saveOptionIsAvailable}
					title={
						saveOptionIsAvailable
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
					disabled={!saveOptionIsAvailable}
					onClick={discardChanges}
				>
					Discard changes
				</JButton>
				<JButton
					jstyle='primary'
					className={s.save}
					disabled={!saveOptionIsAvailable}
					loading={isSavingChanges}
					onClick={saveChanges}
				>
					Save changes
				</JButton>
			</div>
		</div>
	)
}
