import { ChangeEvent, Dispatch, SetStateAction, useRef } from 'react'
import s from './TutorialAccountEditor.module.scss'
import { default as ReorderIcon } from '@/public/reorder.svg'
import { default as DeleteIcon } from '@/public/delete.svg'
import { JButton, JInput, JNumberAccounting } from '@/components/JForm'
import { JGrid, JGridTypes } from '@/components/JGrid/JGrid'
import { delay, moveItemInArray } from '@/utils'
import { handleReorder } from './func/handleReorder'

interface TutorialAccountEditorProps {
	actData: AccountItem[]
	setActData: Dispatch<SetStateAction<AccountItem[]>>
}
export function TutorialAccountEditor({ actData, setActData }: TutorialAccountEditorProps) {
	const actRowRefs = useRef<ActRowsRef>({})

	const addToActRowRefs =
		<T extends keyof ActRowsRef[string]>(account_id: string, key: T) =>
		(node: ActRowsRef[string][T] | null) => {
			if (actRowRefs.current[account_id] === undefined) {
				actRowRefs.current[account_id] = {
					[key]: node || undefined,
				} as ActRowsRef[string]
			} else {
				actRowRefs.current[account_id][key] = node || undefined
			}
		}
	console.log(actRowRefs)
	type AccountKey = 'name' | 'starting_amount'

	const updateVal = (account_id: string, key: AccountKey, val: string) => {
		setActData((prev) => {
			const clone = structuredClone(prev)
			const index = clone.findIndex((it) => it.id === account_id)
			clone[index][key] = val
			return clone
		})
	}

	const handleInputBlur =
		(account_id: string, key: AccountKey) => (e: ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value
			const trimmed = value.trim()
			if (value !== trimmed) {
				e.target.value = trimmed
				updateVal(account_id, key, trimmed)
			}
		}

	const applyReorder = (oldIndex: number, newIndex: number) => {
		let thisTransactionID = ''
		setActData((prev) => {
			const clone = structuredClone(prev)
			thisTransactionID = clone[oldIndex].id
			moveItemInArray(clone, oldIndex, newIndex)
			return clone
		})
		delay(5).then(() => {
			actRowRefs.current[thisTransactionID] &&
				actRowRefs.current[thisTransactionID].reorderButton!.focus()
		})
	}

	const headers: JGridTypes.Header[] = [
		{
			content: <div className={`${s.cell} ${s.control_header}`}></div>,
			defaultWidth: 60,
			noResize: true,
		},
		{
			content: (
				<div className={`${s.cell} ${s.name_header}`}>
					<div className={s.header}>Name</div>
				</div>
			),
			defaultWidth: 90,
		},
		{
			content: (
				<div className={`${s.cell} ${s.starting_amount_header}`}>
					<div className={s.header}>Starting Amount</div>
				</div>
			),
			defaultWidth: 60,
		},
	]

	const cells = actData.map((act, index) => {
		return (
			<div
				style={{ display: 'contents' }}
				ref={addToActRowRefs(act.id, 'container')}
				key={`${act.id}-${index}`}
			>
				<div className={`${s.cell} ${s.control}`}>
					<div className={s.delete_container}>
						<JButton
							jstyle='invisible'
							ref={addToActRowRefs(act.id, 'deleteButton')}
							onClick={() => {
								setActData((prev) => {
									const clone = structuredClone(prev)
									return clone.filter((it) => it.id !== act.id)
								})
							}}
						>
							<DeleteIcon />
						</JButton>
					</div>
					<div className={s.reorder_container}>
						<JButton
							jstyle='invisible'
							disabled={actData.length <= 1}
							ref={addToActRowRefs(act.id, 'reorderButton')}
							onMouseDown={(e) => {
								if (window.getSelection()) {
									window.getSelection()!.removeAllRanges()
								}
								handleReorder(
									act.id,
									actRowRefs,
									actData.map((act) => act.id),
									index,
									e,
									applyReorder
								)
							}}
						>
							<ReorderIcon />
						</JButton>
					</div>
				</div>
				<div className={`${s.cell} ${s.name}`}>
					<JInput
						value={act.name}
						onChange={(e) => updateVal(act.id, 'name', e.target.value)}
						ref={addToActRowRefs(act.id, 'nameInput')}
						onBlur={handleInputBlur(act.id, 'name')}
						placeholder='e.x. Checkings, Credit, Savings'
					/>
				</div>
				<div className={`${s.cell} ${s.starting_amount}`}>
					<JNumberAccounting
						value={act.starting_amount}
						onChange={(e) =>
							updateVal(act.id, 'starting_amount', e.target.value)
						}
						ref={addToActRowRefs(act.id, 'startingAmountInput')}
						onBlur={handleInputBlur(act.id, 'starting_amount')}
					/>
				</div>
			</div>
		)
	})

	const newAccountRow = (() => {
		const createNewAccount = () => {
			const tempID = crypto.randomUUID()

			setActData((prev) => {
				const clone = structuredClone(prev)
				clone.push({ name: '', id: tempID, starting_amount: '0.00' })
				return clone
			})
			delay(10).then(() => {
				if (actRowRefs.current[tempID]) {
					const input = actRowRefs.current[tempID].nameInput!
					input.focus()
				}
			})
		}

		return (
			<div style={{ display: 'contents' }}>
				<div className={`${s.cell} ${s.new_button_container}`}>
					<JButton jstyle='primary' onClick={createNewAccount}>
						Create New Account
					</JButton>
				</div>
			</div>
		)
	})()

	cells.push(newAccountRow)

	return (
		<div className={s.main}>
			<div className={s.grid_container}>
				<JGrid
					cells={cells}
					headers={headers}
					useFullWidth
					noBorders
					stickyHeaders
				/>
			</div>
		</div>
	)
}

export type AccountItem = { id: string; name: string; starting_amount: string }

export type ActRowsRef = {
	[account_id: string]: {
		container?: HTMLDivElement
		nameInput?: HTMLInputElement
		deleteButton?: HTMLButtonElement
		reorderButton?: HTMLButtonElement
		startingAmountInput?: HTMLInputElement
	}
}
