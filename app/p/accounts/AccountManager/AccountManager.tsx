'use client'
import {
	ChangeEvent,
	FocusEvent,
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import s from './AccountManager.module.scss'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import { JButton, JInput, JNumberAccounting } from '@/components/JForm'
import { default as LoadingAnim } from '@/public/loading.svg'
import { default as UndoRedoIcon } from '@/public/undo_redo.svg'
import { NewAccountForm } from './NewAccountForm/NewAccountForm'
import {
	createPopup,
	isStandardError,
	promptError,
	useBgLoad,
	arraysAreEqual,
} from '@/utils'
import {
	updatePreferredColumnWidth,
	saveChanges,
	handleInputChange as handleInputChangeDef,
	handleInputBlur as handleInputBlurDef,
	undoMostRecentAction as undoMostRecentActionDef,
	HistoryItem,
	redoMostRecentAction as redoMostRecentActionDef,
	fetchAndLoadData as fetchAndLoadDataDef,
} from './func'
import { RowController } from './RowController/RowController'
import { FetchedAccount } from '@/database'

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
	const [defaultColumnWidths, setDefaultColumnWidths] = useState<number[]>([150, 200])
	const [data, setData] = useState<FetchedAccount[] | null>(null)
	const [isSavingChanges, setIsSavingChanges] = useState(false)
	const [pendingChanges, setPendingChanges] = useState<Change[]>([])
	const [currentSortOrder, setCurrentSortOrder] = useState<string[]>([])
	const [defaultSortOrder, setDefaultSortOrder] = useState<string[]>([])
	const [undoHistoryStack, setUndoHistoryStack] = useState<HistoryItem[]>([])
	const [redoHistoryStack, setRedoHistoryStack] = useState<HistoryItem[]>([])
	const gridRowRefs = useRef<HTMLDivElement[]>([])

	// below refs are used in event listeners and memoized functions to ensure we are pulling the most recent data while maintaining performance
	const pendingChangesRef = useRef<Change[]>(pendingChanges)
	const currentSortOrderRef = useRef<string[]>(currentSortOrder)
	const defaultSortOrderRef = useRef<string[]>(defaultSortOrder)
	const isLoadingRef = useRef<boolean>(isLoading)
	const undoHistoryStackRef = useRef<HistoryItem[]>(undoHistoryStack)
	const redoHistoryStackRef = useRef<HistoryItem[]>(redoHistoryStack)
	useEffect(() => {
		pendingChangesRef.current = pendingChanges
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
	}, [undoHistoryStack])
	useEffect(() => {
		redoHistoryStackRef.current = redoHistoryStack
	}, [redoHistoryStack])

	// used to enable/disable "save" buttons and functions, since there's two different types of changes to be saved (data changes and sort order changes)
	const saveOptionIsAvailable = useMemo(() => {
		return (
			pendingChanges.length !== 0 ||
			!arraysAreEqual(currentSortOrder, defaultSortOrder)
		)
	}, [pendingChanges, currentSortOrder, defaultSortOrder])

	// memoizing and redefining imported functions for simplicity and performance
	const fetchAndLoadData = useCallback(() => {
		setUndoHistoryStack([])
		setRedoHistoryStack([])
		return fetchAndLoadDataDef(
			setIsLoading,
			gridRowRefs,
			setDefaultColumnWidths,
			setData,
			setCurrentSortOrder,
			setDefaultSortOrder
		)
	}, [])
	const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		handleInputChangeDef(
			e,
			pendingChangesRef,
			setPendingChanges,
			setUndoHistoryStack,
			setRedoHistoryStack
		)
	}, [])
	const undoMostRecentAction = useCallback(() => {
		undoMostRecentActionDef(
			undoHistoryStackRef,
			setCurrentSortOrder,
			pendingChangesRef,
			setPendingChanges,
			setUndoHistoryStack,
			setRedoHistoryStack
		)
	}, [])
	const redoMostRecentAction = useCallback(() => {
		redoMostRecentActionDef(
			redoHistoryStackRef,
			setCurrentSortOrder,
			pendingChangesRef,
			setPendingChanges,
			setUndoHistoryStack,
			setRedoHistoryStack
		)
	}, [])
	const handleInputBlur = useCallback((e: FocusEvent<HTMLInputElement, Element>) => {
		handleInputBlurDef(e, pendingChangesRef, setPendingChanges)
	}, [])

	// other memoized functions
	const handleSaveChanges = useCallback(async () => {
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
						currentSortOrderRef,
						defaultSortOrderRef,
						pendingChangesRef
					)
				} catch (e) {
					if (isStandardError(e)) {
						promptError(
							'An unexpected error has occurred while saving your changes:',
							e.message,
							'Try refreshing the page to resolve this issue.'
						)
					} else {
						console.error(e)
					}
				}
				fetchAndLoadData()
				setPendingChanges([])
				setUndoHistoryStack([])
				setRedoHistoryStack([])
			}
			setIsSavingChanges(false)
		}
	}, [saveOptionIsAvailable, data])
	const discardChanges = useCallback(() => {
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
		setCurrentSortOrder(defaultSortOrderRef.current)
		setPendingChanges([])
		setUndoHistoryStack([])
		setRedoHistoryStack([])
	}, [])
	const handleCreateAccountButton = useCallback(() => {
		const myPopup = createPopup(
			<NewAccountForm
				afterSubmit={async () => {
					myPopup.close()
					fetchAndLoadData()
				}}
			/>
		)
		myPopup.trigger()
	}, [])
	const handleInputFocus = useCallback((e: FocusEvent<HTMLInputElement, Element>) => {
		e.target.dataset['value_on_focus'] = e.target.value
	}, [])
	const updateDefaultColumnWidth: JGridTypes.ColumnResizeEventHandler = useCallback(
		async (e) => {
			bgLoad.start()
			try {
				await updatePreferredColumnWidth(e.columnIndex - 1, e.newWidth)
			} catch (e) {
				if (isStandardError(e)) {
					console.error(
						`Minor error occurred when updating preferredColumnWidth: ${e.message}`
					)
				}
			}
			bgLoad.stop()
		},
		[]
	)

	useEffect(() => {
		fetchAndLoadData()

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
				else if (e.ctrlKey && !e.shiftKey && e.key.toUpperCase() === 'Z') {
					e.preventDefault()
					if (undoHistoryStackRef.current.length !== 0) {
						undoMostRecentAction()
					}
					return
				}

				// CTRL+SHIFT+Z to redo
				else if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'Z') {
					e.preventDefault()
					if (redoHistoryStackRef.current.length !== 0) {
						redoMostRecentAction()
					}
					return
				}

				// ENTER to focus next item
				else if (
					e.key === 'Enter' &&
					(document.activeElement as HTMLElement).tagName === 'INPUT'
				) {
					e.preventDefault()
					const currentElement = document.activeElement as HTMLInputElement

					const focusableElements = Array.from(
						document.querySelectorAll<HTMLInputElement>('input')
					).filter(
						(elem) =>
							!elem.disabled && !elem.hidden && elem.offsetParent !== null
					)

					const currentIndex = focusableElements.indexOf(currentElement)

					if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
						focusableElements[currentIndex + 1].focus()
					}
				}
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [])

	// memoizing headers as this doesn't change much between renders

	const historyButtons: JGridTypes.Header['content'] = useMemo(
		() => (
			<div className={s.header_container}>
				<div className={s.history_control_container}>
					<button
						className={s.undo}
						onClick={undoMostRecentAction}
						disabled={undoHistoryStack.length === 0}
						title='Undo most recent change'
					>
						<UndoRedoIcon />
					</button>
					<button
						className={s.redo}
						onClick={redoMostRecentAction}
						disabled={redoHistoryStack.length === 0}
						title='Redo most recent change'
					>
						<UndoRedoIcon />
					</button>
				</div>
			</div>
		),
		[undoHistoryStack, redoHistoryStack]
	)

	const gridHeaders: JGridTypes.Header[] = useMemo(
		() => [
			{
				content: historyButtons,
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
		],
		[historyButtons, defaultColumnWidths]
	)

	let grid: ReactNode
	if (!isLoading && data !== null && defaultColumnWidths !== null) {
		if (data.length === 0) {
			grid = (
				<p>
					You do not have any accounts, click "Create new account" below to get
					started!
				</p>
			)
		} else {
			const cells = currentSortOrder.map((sortId, sortIndex) => {
				const thisData = data.find((item) => item.id === sortId)!
				const thisPendingChangeIndex = pendingChanges.findIndex(
					(change) => change.account_id === sortId
				)
				const thisPendingChange =
					thisPendingChangeIndex === -1
						? null
						: pendingChanges[thisPendingChangeIndex]

				return [
					{
						content: (
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
									fetchAndLoadData={fetchAndLoadData}
									setUndoHistoryStack={setUndoHistoryStack}
									setRedoHistoryStack={setRedoHistoryStack}
								/>
							</div>
						),
					},
					{
						content: (
							<div key={`2-${thisData.id}`} className={s.cell_container}>
								<JInput
									onChange={handleInputChange}
									onBlur={handleInputBlur}
									onFocus={handleInputFocus}
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
							</div>
						),
					},
					{
						content: (
							<div key={`3-${thisData.id}`} className={s.cell_container}>
								<JNumberAccounting
									onChange={handleInputChange}
									onBlur={handleInputBlur}
									onFocus={handleInputFocus}
									className={`${s.starting_amount_input} ${
										thisPendingChange?.new.starting_amount
											? s.changed
											: ''
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
							</div>
						),
					},
				]
			})
			const gridConfig: JGridTypes.Props = {
				headers: gridHeaders,
				cells: cells,
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
