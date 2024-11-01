'use client'
import { ReactNode, useEffect, useRef, useState } from 'react'
import s from './AccountManager.module.scss'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import { JButton, JInput, JNumberAccounting } from '@/components/JForm'
import { default as LoadingAnim } from '@/public/loading.svg'
import { NewAccountForm } from './NewAccountForm/NewAccountForm'
import {
	createPopup,
	isStandardError,
	createPreferencesEntry,
	promptError,
	useBgLoad,
	arraysAreEqual,
} from '@/utils'
import {
	updatePreferredColumnWidth,
	fetchData,
	fetchPreferredColumnWidths,
	saveChanges,
	handleInputChange,
	handleInputBlur,
} from './func'
import { RowController } from './RowController/RowController'

export interface Change {
	account_id: string
	new: {
		name?: string
		starting_amount?: string
	}
}
interface HistoryItemReorder {
	action: 'reorder'
	oldIndex: number
	newIndex: number
}
interface HistoryItemValueChange {
	action: 'value_change'
	account_id: string
	key: keyof Account.Bare
	oldVal: string
	newVal: string
}
export type HistoryItem = HistoryItemReorder | HistoryItemValueChange

export function AccountManager() {
	const bgLoad = useBgLoad()
	const [isLoading, setIsLoading] = useState(true)
	const [defaultColumnWidths, setDefaultColumnWidths] = useState<number[] | null>(null)
	const [data, setData] = useState<Account.Full[] | null>(null)
	const [isSavingChanges, setIsSavingChanges] = useState(false)
	const [pendingChanges, setPendingChanges] = useState<Change[]>([])
	const [currentSortOrder, setCurrentSortOrder] = useState<Account.ID[]>([])
	const [defaultSortOrder, setDefaultSortOrder] = useState<Account.ID[]>([])
	const [undoHistoryStack, setUndoHistoryStack] = useState<HistoryItem[]>([])
	const [redoHistoryStack, setRedoHistoryStack] = useState<HistoryItem[]>([])
	const gridRowRefs = useRef<HTMLDivElement[]>([])

	/**
	 * use below refs in event listeners to ensure you're pulling the latest data, as event handlers don't always get updated on re-renders
	 */
	const pendingChangesRef = useRef<Change[]>(pendingChanges)
	const currentSortOrderRef = useRef<Account.ID[]>(currentSortOrder)
	const defaultSortOrderRef = useRef<Account.ID[]>(defaultSortOrder)
	const isLoadingRef = useRef<boolean>(isLoading)
	const undoHistoryStackRef = useRef<HistoryItem[]>(undoHistoryStack)
	const redoHistoryStackRef = useRef<HistoryItem[]>(redoHistoryStack)
	useEffect(() => {
		pendingChangesRef.current = pendingChanges
		console.log('pendingChanges changed!', pendingChangesRef.current)
	}, [pendingChanges])
	useEffect(() => {
		currentSortOrderRef.current = currentSortOrder
	}, [currentSortOrder])
	useEffect(() => {
		defaultSortOrderRef.current = defaultSortOrder
	}, [defaultSortOrder])
	useEffect(() => {
		isLoadingRef.current = isLoading
	}, [isLoading])
	useEffect(() => {
		undoHistoryStackRef.current = undoHistoryStack
		console.log('undoHistoryStack', undoHistoryStack)
	}, [undoHistoryStack])
	useEffect(() => {
		redoHistoryStackRef.current = redoHistoryStack
	}, [redoHistoryStack])

	/**
	 * used to enable/disable "save" buttons and functions, since there's two different types of changes to be saved
	 *
	 * (data changes in `pendingChanges`, and changes to `sortOrder`)
	 */
	const saveOptionIsAvailable =
		pendingChanges.length !== 0 || !arraysAreEqual(currentSortOrder, defaultSortOrder)

	async function loadInitData() {
		setIsLoading(true)
		gridRowRefs.current = []
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
							promptError(
								'An unexpected error has occured while propegating table layout preferences in the database:',
								e.message,
								'Try refreshing the page to resolve this issue.'
							)
						}
					}
				} else {
					promptError(
						'An unexpected error has occured while fetching table layout preferences in the database:',
						e.message,
						'Try refreshing the page to resolve this issue.'
					)
				}
			}
		}
		try {
			const data = await fetchData()
			setData(data)
			setIsLoading(false)
			const sortOrder = data.map((item) => item.id)
			setCurrentSortOrder(sortOrder)
			setDefaultSortOrder(sortOrder)
		} catch (e) {
			if (isStandardError(e)) {
				promptError(
					'An unexpected error has occured while fetching your data:',
					e.message,
					'Try refreshing the page to resolve this issue.'
				)
			} else {
				console.error(e)
			}
		}
	}
	useEffect(() => {
		loadInitData()

		const handleKeyDown = async (e: KeyboardEvent) => {
			if (!isLoadingRef.current) {
				// CTRL+S to save
				if (e.ctrlKey && e.key.toUpperCase() === 'S') {
					e.preventDefault()
					if (
						pendingChangesRef.current.length !== 0 ||
						!arraysAreEqual(
							currentSortOrderRef.current!,
							defaultSortOrderRef.current!
						)
					) {
						await handleSaveChanges()
					}
					return
				}

				// CTRL+Z to undo
				if (e.ctrlKey && !e.shiftKey && e.key.toUpperCase() === 'Z') {
					e.preventDefault()
					if (undoHistoryStackRef.current.length !== 0) {
						const mostRecentAction = undoHistoryStackRef.current.at(-1)!
						// need to update pendingChanges when ran
						if (mostRecentAction.action === 'reorder') {
							const { newIndex, oldIndex } = mostRecentAction
							setCurrentSortOrder((prev) => {
								const newArr = [...prev!]
								const [item] = newArr.splice(newIndex, 1)
								newArr.splice(oldIndex, 0, item)
								return newArr
							})
						} else {
							const { account_id, key, oldVal, newVal } = mostRecentAction

							const node = document.querySelector(
								`[data-id="${account_id}"][data-key="${key}"]`
							) as HTMLInputElement

							const thisPendingChangeIndex =
								pendingChangesRef.current.findIndex(
									(item) => item.account_id === account_id
								)
							if (thisPendingChangeIndex !== -1) {
								// if there is a pendingChange for the entry we are undo'ing
								const thisPendingChange =
									pendingChangesRef.current[thisPendingChangeIndex]

								let defaultVal = node.dataset['default'] as string
								let returningToDefault = false
								if (
									(!isNaN(parseInt(defaultVal)) &&
										!isNaN(parseInt(oldVal)) &&
										parseInt(defaultVal) === parseInt(oldVal)) ||
									defaultVal === oldVal
								) {
									returningToDefault = true
								}

								if (returningToDefault) {
									// if we are returning to the default value
									if (
										(key === 'name' &&
											thisPendingChange.new.starting_amount ===
												undefined) ||
										(key === 'starting_amount' &&
											thisPendingChange.new.name === undefined)
									) {
										// if other keys don't exist on pendingChange, remove change
										setPendingChanges((prev) =>
											prev.filter(
												(_, index) =>
													index !== thisPendingChangeIndex
											)
										)
									} else {
										// if other keys DO exist on pendingChange, set key to undefined
										setPendingChanges((prev) => {
											const newArr = structuredClone(prev)
											newArr[thisPendingChangeIndex].new[key] =
												undefined
											return newArr
										})
									}
								} else {
									// set pendingChange to reflect the old value
									setPendingChanges((prev) => {
										const newArr = structuredClone(prev)
										newArr[thisPendingChangeIndex].new[key] = oldVal
										return newArr
									})
								}
							} else {
								// add a pendingChange
								setPendingChanges((prev) => [
									...prev,
									{ account_id: account_id, new: { [key]: oldVal } },
								])
							}
							node.focus()
						}
						setRedoHistoryStack((prev) => [...prev, mostRecentAction])
						setUndoHistoryStack((prev) => prev.slice(0, -1))
					}
					return
				}
				// NEXT: ADD REDO LOGIC
				// CTRL+SHIFT+Z to redo
				if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'Z') {
					console.log('pendingChanges:', pendingChanges)
					e.preventDefault()
					if (redoHistoryStackRef.current.length !== 0) {
						const mostRecentUndoAction = redoHistoryStackRef.current.at(-1)!
						if (mostRecentUndoAction?.action === 'reorder') {
							setCurrentSortOrder((prev) => {
								const newArr = [...prev!]
								const [item] = newArr.splice(
									mostRecentUndoAction.oldIndex,
									1
								)
								newArr.splice(mostRecentUndoAction.newIndex, 0, item)
								return newArr
							})
						} else {
							const node = document.querySelector(
								`[data-id="${mostRecentUndoAction.account_id}"][data-key="${mostRecentUndoAction.key}"]`
							) as HTMLInputElement
							console.log(
								'SETTING THIS NODE VAL TO',
								mostRecentUndoAction.newVal,
								node
							)
							node.value = mostRecentUndoAction.newVal
							node.focus()
							node.blur()
						}
						setUndoHistoryStack((prev) => [...prev, mostRecentUndoAction])
						setRedoHistoryStack((prev) => prev.slice(0, -1))
					}
					return
				}
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [])

	let grid: ReactNode

	async function handleSaveChanges() {
		if (saveOptionIsAvailable) {
			setIsSavingChanges(true)
			// check for empty names
			let isErrors = false
			pendingChangesRef.current.forEach((change) => {
				if (change.new.name !== undefined && change.new.name === '') {
					isErrors = true
					const errorNode = document.querySelector(
						`.${s.account_name_input}[data-id="${change.account_id}"]`
					)
					errorNode?.classList.add(s.error)
					const thisTimeout = setTimeout(() => {
						errorNode?.classList.remove(s.error)
						clearTimeout(thisTimeout)
					}, 1000)
				}
			})
			if (!isErrors) {
				try {
					await saveChanges(
						data,
						currentSortOrder,
						defaultSortOrder,
						pendingChangesRef
					)
				} catch (e) {
					if (isStandardError(e)) {
						promptError(
							'An unexpected error has occured while saving your changes:',
							e.message,
							'Try refreshing the page to resolve this issue.'
						)
					} else {
						console.error(e)
					}
				}
				loadInitData()
				setPendingChanges([])
			}
			setIsSavingChanges(false)
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
		setCurrentSortOrder(defaultSortOrder)
		setPendingChanges([])
	}

	function handleCreateAccountButton() {
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
	if (!isLoading && data !== null && defaultColumnWidths !== null) {
		if (data.length === 0) {
			grid = (
				<p>
					You do not have any accounts, click "Create new account" below to get
					started!
				</p>
			)
		} else {
			const updateDefaultColumnWidth: JGridTypes.ColumnResizeEventHandler = async (
				e
			) => {
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
					content: <div className={s.header_container} />,
					defaultWidth: 55,
					noResize: true,
				},
				{
					content: (
						<div className={s.header_container}>
							<div className={s.header}>Account Name</div>
						</div>
					),
					defaultWidth: defaultColumnWidths[0],
					minWidth: 100,
					maxWidth: 330,
				},
				{
					content: (
						<div className={s.header_container}>
							<div className={s.header}>Starting Amount</div>
						</div>
					),
					defaultWidth: defaultColumnWidths[1],
					minWidth: 100,
					maxWidth: 230,
				},
			]
			const content = currentSortOrder.map((sortId, sortIndex) => {
				const thisData = data.find((item) => item.id === sortId)!
				const thisPendingChangeIndex = pendingChanges.findIndex(
					(change) => change.account_id === sortId
				)
				const thisPendingChange =
					thisPendingChangeIndex === -1
						? null
						: pendingChanges[thisPendingChangeIndex]
				return [
					<div key={`1-${thisData.id}`} className={s.cell_container}>
						<RowController
							account_id={sortId}
							account_name={thisData.name}
							deleteDisabled={saveOptionIsAvailable}
							sortDisabled={data.length <= 1}
							sortIndex={sortIndex}
							currentSortOrder={currentSortOrder}
							defaultSortOrder={defaultSortOrder}
							gridRowRefs={gridRowRefs}
							setCurrentSortOrder={setCurrentSortOrder}
							loadInitData={loadInitData}
							setUndoHistoryStack={setUndoHistoryStack}
							setRedoHistoryStack={setRedoHistoryStack}
						/>
					</div>,
					<div key={`2-${thisData.id}`} className={s.cell_container}>
						<JInput
							onChange={(e) =>
								handleInputChange(
									e,
									pendingChanges,
									setPendingChanges,
									undoHistoryStack,
									setUndoHistoryStack,
									setRedoHistoryStack
								)
							}
							onBlur={(e) =>
								handleInputBlur(e, pendingChanges, setPendingChanges)
							}
							onFocus={(e) => {
								e.target.dataset['value_on_focus'] = e.target.value
							}}
							className={`${s.account_name_input} ${
								thisPendingChange?.new.name ? s.changed : ''
							}`}
							data-id={thisData.id}
							data-key='name'
							data-default={thisData.name}
							maxLength={24}
							value={
								thisPendingChange?.new.name !== undefined
									? thisPendingChange.new.name
									: thisData.name
							}
						/>
					</div>,
					<div key={`3-${thisData.id}`} className={s.cell_container}>
						<JNumberAccounting
							onChange={(e) =>
								handleInputChange(
									e,
									pendingChanges,
									setPendingChanges,
									undoHistoryStack,
									setUndoHistoryStack,
									setRedoHistoryStack
								)
							}
							onBlur={(e) =>
								handleInputBlur(e, pendingChanges, setPendingChanges)
							}
							onFocus={(e) => {
								e.target.dataset['value_on_focus'] = e.target.value
							}}
							className={`${s.starting_amount_input} ${
								thisPendingChange?.new.starting_amount ? s.changed : ''
							}`}
							data-id={thisData.id}
							data-key='starting_amount'
							data-default={thisData.starting_amount.toFixed(2)}
							value={
								thisPendingChange?.new.starting_amount !== undefined
									? thisPendingChange.new.starting_amount
									: thisData.starting_amount
							}
						/>
					</div>,
				]
			})
			const gridConfig: JGridTypes.Props = {
				headers: headers,
				content: content,
				maxTableWidth: 500,
				onResize: updateDefaultColumnWidth,
				minColumnWidth: 30,
				noBorders: true,
			}
			grid = <JGrid {...gridConfig!} className={s.jgrid} />
		}
	}

	return (
		<div className={s.main}>
			<h2>Account Manager</h2>

			{isLoading ? (
				<div className={s.loading_container}>
					<LoadingAnim />
				</div>
			) : (
				<div className={s.jgrid_container}>{grid}</div>
			)}

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
					onClick={handleSaveChanges}
				>
					Save changes
				</JButton>
			</div>
		</div>
	)
}
