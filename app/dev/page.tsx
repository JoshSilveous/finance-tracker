import { JDatePicker } from '@/components/JForm/JDatePicker/JDatePicker'

export default function Dev() {
	const defaultDate = '1980-03-23'
	return (
		<div
			style={{
				height: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<JDatePicker defaultValue={defaultDate} />
		</div>
	)
}
