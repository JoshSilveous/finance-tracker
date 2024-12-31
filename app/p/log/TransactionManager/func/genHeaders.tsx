import { JButton } from '@/components/JForm'
import { default as UndoRedoIcon } from '@/public/undo_redo.svg'
import { HistoryController } from '../hooks'
import s from '../TransactionManager.module.scss'
import { JGridTypes } from '@/components/JGrid/JGrid'

export function genHeaders(historyController: HistoryController) {
	const undoTitle = 'Undo most recent change.\nShortcut: CTRL + Z'
	const redoTitle = 'Redo most recent change.\nShortcut: CTRL + ALT + Z'
	const headers: JGridTypes.Header[] = [
		{
			content: (
				<div className={`${s.header_container} ${s.control}`}>
					<JButton
						jstyle='invisible'
						className={s.undo}
						onClick={historyController.undo}
						disabled={historyController.undoDisabled}
						title={undoTitle}
					>
						<UndoRedoIcon />
					</JButton>
					<JButton
						jstyle='invisible'
						className={s.redo}
						onClick={historyController.redo}
						disabled={historyController.redoDisabled}
						title={redoTitle}
					>
						<UndoRedoIcon />
					</JButton>
				</div>
			),
			defaultWidth: 100,
			noResize: true,
		},
		{
			content: (
				<div className={`${s.header_container} ${s.first}`}>
					<div className={s.text}>Date</div>
				</div>
			),
			defaultWidth: 140,
			minWidth: 105,
			maxWidth: 150,
		},
		{
			content: (
				<div className={s.header_container}>
					<div className={s.text}>Name</div>
				</div>
			),
			defaultWidth: 260,
			minWidth: 160,
			maxWidth: 300,
		},
		{
			content: (
				<div className={s.header_container}>
					<div className={s.text}>Amount</div>
				</div>
			),
			defaultWidth: 140,
			minWidth: 95,
			maxWidth: 160,
		},
		{
			content: (
				<div className={s.header_container}>
					<div className={s.text}>Category</div>
				</div>
			),
			defaultWidth: 170,
			minWidth: 110,
			maxWidth: 200,
		},
		{
			content: (
				<div className={`${s.header_container} ${s.last}`}>
					<div className={s.text}>Account</div>
				</div>
			),
			defaultWidth: 170,
			minWidth: 110,
			maxWidth: 200,
		},
		{
			content: (
				<div className={`${s.header_container} ${s.more_controls}`}>
					<div />
				</div>
			),
			defaultWidth: 50,
			noResize: true,
		},
	]
	return headers
}
