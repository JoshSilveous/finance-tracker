import s from './genGapRow.module.scss'

export function genGapRow() {
	const columnCount = 6
	const cells: JSX.Element[] = []
	for (let i = 0; i < columnCount; i++) {
		cells.push(<div className={s.gap_cell} />)
	}
	return cells
}
