import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import s from './page.module.scss'
import { fetchDataTest } from './clientFunctions'
import { JGrid } from '@/components/JGrid'
import { JGridTypes } from '@/components/JGrid/JGrid'

export default async function Home() {
	const supabase = createClient()

	const { data, error } = await supabase.auth.getUser()
	if (error || !data?.user) {
		redirect('/login')
	}
	const cellStyle: React.CSSProperties = {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
	}
	const gridConfig: JGridTypes.Props = {
		headers: [
			{
				content: <div className={s.header}>COLUMN 1</div>,
				defaultWidth: 150,
				minWidth: 100,
				maxWidth: 330,
			},
			{
				content: <div className={s.header}>COLUMN 2</div>,
				defaultWidth: 150,
				minWidth: 100,
				maxWidth: 330,
			},
			{
				content: <div className={s.header}>COLUMN 3</div>,
				defaultWidth: 150,
				minWidth: 100,
				maxWidth: 330,
			},
		],
		cells: [
			[
				{ content: <div style={cellStyle}>Row 1 Cell 1!</div> },
				{ content: <div style={cellStyle}>Row 1 Cell 2!</div> },
				{ content: <div style={cellStyle}>Row 1 Cell 3!</div> },
			],
			[
				{ content: <div style={cellStyle}>Row 2 Cell 1!</div> },
				{ content: <div style={cellStyle}>Row 2 Cell 2!</div> },
				{ content: <div style={cellStyle}>Row 2 Cell 3!</div> },
			],
			[
				{
					content: <div style={cellStyle}>Row 3 Cell 1!</div>,
					cellStyle: { gridColumn: '1 / 3' },
				},
				{
					content: <div style={cellStyle}>Row 3 Cell 2!</div>,
					cellStyle: { gridColumn: '3 / 4' },
				},
			],
		],
		maxTableWidth: 500,
		minColumnWidth: 30,
		noBorders: true,
	}

	return (
		<div className={s.container}>
			<p>Hello {data.user.email}</p>
			<button onClick={fetchDataTest}>Test query</button>
			<JGrid {...gridConfig} />
		</div>
	)
}
