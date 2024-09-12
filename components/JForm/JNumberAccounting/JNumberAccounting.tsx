import { ChangeEvent, InputHTMLAttributes, useRef } from 'react'
import s from './JNumberAccounting.module.scss'

interface JNumberAccountingProps extends InputHTMLAttributes<HTMLInputElement> {}

export default function JNumberAccounting(props: JNumberAccountingProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	function handleBlur(e: ChangeEvent<HTMLInputElement>) {
		const unroundedVal = e.target.value
		const roundedVal = parseFloat(unroundedVal).toFixed(2)

		e.target.dataset.rawValue = roundedVal

		const formattedVal = addCommasToNumber(roundedVal)
		console.log('roundedVal', roundedVal, 'formattedVal', formattedVal)

		e.target.type = 'text'
		e.target.value = formattedVal
	}

	function addCommasToNumber(numberString: string) {
		// Split the string into the whole number and decimal parts
		let [wholePart, decimalPart] = numberString.split('.')

		// Use a regular expression to add commas to the whole number part
		wholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

		// Reassemble the whole number and decimal parts (if present)
		return decimalPart ? `${wholePart}.${decimalPart}` : wholePart
	}

	function handleFocus(e: ChangeEvent<HTMLInputElement>) {
		const rawValue = e.target.dataset.rawValue
		console.log('focus rawValue', rawValue)

		e.target.type = 'number'
		if (rawValue !== '' && rawValue !== undefined) {
			e.target.value = rawValue
		}
	}

	return (
		<div className={s.main}>
			<span className={s.dollar_symbol}>$</span>
			<input
				ref={inputRef}
				{...props}
				type='text'
				step={0.01}
				onBlur={handleBlur}
				onFocus={handleFocus}
				data-raw-value={props.value}
			/>
		</div>
	)
}
