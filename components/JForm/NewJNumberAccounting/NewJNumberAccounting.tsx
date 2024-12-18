import { useState } from 'react'
import s from './NewJNumberAccounting.module.scss'

export function NewJNumberAccounting() {
	const [value, setValue] = useState(0)
	const [isHovering, setIsHovering] = useState(false)
	const [isFocused, setIsFocused] = useState(false)

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newVal = e.target.valueAsNumber
		setValue(newVal)
	}

	return (
		<div
			className={`${s.main} ${isHovering || isFocused ? s.reveal_input : ''}`}
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => setIsHovering(false)}
		>
			<input
				type='number'
				onChange={onChange}
				value={value}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
			/>
			<div className={s.display}>disp: {value}</div>
		</div>
	)
}
