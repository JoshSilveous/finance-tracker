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
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.key === 's') {
				e.preventDefault()
				saveChanges()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [])

	let grid: ReactNode

	async function saveChanges() {
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
			currentSortOrder!.forEach((sortAccountID, sortIndex) => {
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
					content: (
						<div className={s.header_container}>
							<div className={s.header_controls}>#</div>
						</div>
					),
					defaultWidth: 30,
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

				const handleReorderMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
					document.body.style.cursor = 'grabbing'

					// pop out row
					const rowNode =
						gridRowRefs.current[sortIndex].parentElement!.parentElement!
							.parentElement!
					const tableNode = rowNode.parentElement!
					const grabberNode = e.currentTarget as HTMLDivElement
					const grabberContainerNode = rowNode.childNodes[0] as HTMLDivElement

					const tableWidth = tableNode.offsetWidth
					const tableLeft = tableNode.offsetLeft
					const grabberContainerWidth = grabberContainerNode.offsetWidth

					rowNode.childNodes.forEach((childNode) => {
						const node = childNode as HTMLDivElement
						node.style.width = `${node.offsetWidth}px`
					})

					const offsetX =
						grabberNode.offsetLeft +
						grabberNode.offsetWidth / 2 -
						grabberContainerNode.offsetLeft
					const offsetY =
						grabberNode.offsetTop +
						grabberNode.offsetHeight / 2 -
						grabberContainerNode.offsetTop

					rowNode.style.left = `${e.clientX - offsetX}px`
					rowNode.style.top = `${e.clientY - offsetY}px`

					rowNode.style.display = 'flex'
					rowNode.style.position = 'fixed'
					rowNode.style.zIndex = '999'

					// add highlight effect
					const breakpoints: number[] = []
					gridRowRefs.current.forEach((row, index) => {
						if (index !== sortIndex) {
							breakpoints.push(row.offsetTop)
						}
					})
					console.log(gridRowRefs.current)

					breakpoints.push(
						breakpoints.at(-1)! + gridRowRefs.current.at(-1)!.offsetHeight
					)

					const highlightDiv = document.createElement('div')
					document.body.appendChild(highlightDiv)

					function putHighlightOnRow(rowIndex: number) {
						highlightDiv.className = s.highlighter

						switch (rowIndex) {
							case 0:
								highlightDiv.style.top = `${breakpoints[rowIndex]}px`
								break
							case currentSortOrder!.length - 1:
								highlightDiv.style.top = `${breakpoints[rowIndex] + 2}px`
								break
							default:
								highlightDiv.style.top = `${breakpoints[rowIndex] - 0.7}px`
								break
						}
						highlightDiv.style.left = `${
							tableLeft + grabberContainerWidth - 1
						}px`
						highlightDiv.style.width = `${
							tableWidth - grabberContainerWidth + 2
						}px`
					}

					let closestBreakpointIndex = -1
					function handleReorderMouseMove(e: MouseEvent) {
						rowNode.style.left = `${e.clientX - offsetX}px`
						rowNode.style.top = `${e.clientY - offsetY}px`

						const prevClosestBreakpointIndex = closestBreakpointIndex
						closestBreakpointIndex = breakpoints.reduce(
							(closestIndex, currentValue, currentIndex) => {
								return Math.abs(currentValue - e.clientY) <
									Math.abs(breakpoints[closestIndex] - e.clientY)
									? currentIndex
									: closestIndex
							},
							0
						)
						if (prevClosestBreakpointIndex !== closestBreakpointIndex) {
							putHighlightOnRow(closestBreakpointIndex)
						}
					}
					function handleReorderMouseUp() {
						rowNode.childNodes.forEach((childNode) => {
							const node = childNode as HTMLDivElement
							node.style.width = ''
						})
						// console.clear()
						rowNode.style.display = ''
						rowNode.style.top = ''
						rowNode.style.left = ''
						rowNode.style.zIndex = ''
						rowNode.style.position = ''
						highlightDiv.remove()
						rowNode.classList.remove(s.highlighted)

						if (closestBreakpointIndex !== sortIndex) {
							setCurrentSortOrder((prev) => {
								const newArr = [...prev!]
								const [item] = newArr.splice(sortIndex, 1)
								newArr.splice(closestBreakpointIndex, 0, item)
								return newArr
							})
						}

						document.body.style.cursor = ''
						window.removeEventListener('mousemove', handleReorderMouseMove)
						window.removeEventListener('mouseup', handleReorderMouseUp)
					}
					window.addEventListener('mousemove', handleReorderMouseMove)
					window.addEventListener('mouseup', handleReorderMouseUp)
				}

				return [
					<div key={`1-${thisData.id}`} className={s.cell_container}>
						<div
							className={`${s.row_controls_container} ${
								sortId !== defaultSortOrder![sortIndex] ? s.changed : ''
							}`}
							ref={(elem) => {
								gridRowRefs.current[sortIndex] = elem as HTMLDivElement
							}}
						>
							<div
								className={s.reorder_grabber}
								onMouseDown={handleReorderMouseDown}
							>
								#
							</div>
						</div>
					</div>,
					<div key={`2-${thisData.id}`} className={s.cell_container}>
						<JInput
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
						/>
					</div>,
					<div key={`3-${thisData.id}`} className={s.cell_container}>
						<JNumberAccounting
							onChange={handleChange}
							onBlur={handleBlur}
							className={`${s.starting_amount_input} ${
								thisPendingChange?.new.starting_amount ? s.changed : ''
							}`}
							data-id={thisData.id}
							data-key='starting_amount'
							data-default={thisData.starting_amount.toFixed(2)}
							defaultValue={thisData.starting_amount}
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
