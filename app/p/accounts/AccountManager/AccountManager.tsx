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
	createErrorPopup,
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

export function AccountManager() {
	const bgLoad = useBgLoad()
	const [isLoading, setIsLoading] = useState(true)
	const [defaultColumnWidths, setDefaultColumnWidths] = useState<number[] | null>(null)
	const [data, setData] = useState<Account.Full[] | null>(null)
	const [isSavingChanges, setIsSavingChanges] = useState(false)
	const [pendingChanges, setPendingChanges] = useState<Change[]>([])
	const [currentSortOrder, setCurrentSortOrder] = useState<Account.ID[] | null>(null)
	const [defaultSortOrder, setDefaultSortOrder] = useState<Account.ID[] | null>(null)
	const gridRowRefs = useRef<HTMLDivElement[]>([])

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
		(currentSortOrder !== null &&
			defaultSortOrder !== null &&
			!arraysAreEqual(currentSortOrder, defaultSortOrder))

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
			setCurrentSortOrder(sortOrder)
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

		// CTRL+S to save
		const handleKeyDown = async (e: KeyboardEvent) => {
			if (e.ctrlKey && e.key === 's') {
				e.preventDefault()
				await handleSaveChanges()
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
			try {
				await saveChanges(
					data,
					currentSortOrder,
					defaultSortOrder,
					pendingChangesRef
				)
			} catch (e) {
				if (isStandardError(e)) {
					createErrorPopup(e.message)
				} else {
					console.error(e)
				}
			}
			setIsSavingChanges(false)
			loadInitData()
			setPendingChanges([])
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
	if (
		!isLoading &&
		data !== null &&
		currentSortOrder !== null &&
		defaultColumnWidths !== null
	) {
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
						/>
					</div>,
					<div key={`2-${thisData.id}`} className={s.cell_container}>
						<JInput
							onChange={(e) =>
								handleInputChange(e, pendingChanges, setPendingChanges)
							}
							onBlur={(e) =>
								handleInputBlur(e, pendingChanges, setPendingChanges)
							}
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
								handleInputChange(e, pendingChanges, setPendingChanges)
							}
							onBlur={(e) =>
								handleInputBlur(e, pendingChanges, setPendingChanges)
							}
							className={`${s.starting_amount_input} ${
								thisPendingChange?.new.starting_amount ? s.changed : ''
							}`}
							data-id={thisData.id}
							data-key='starting_amount'
							data-default={thisData.starting_amount.toFixed(2)}
							defaultValue={thisData.starting_amount}
							maxDigits={8}
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
