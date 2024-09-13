import { ChangeEvent, InputHTMLAttributes, useEffect, useRef, useState } from 'react'
import s from './JNumberAccounting.module.scss'

interface JNumberAccountingProps extends InputHTMLAttributes<HTMLInputElement> {}

export default function JNumberAccounting(props: JNumberAccountingProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [isFocused, setIsFocused] = useState(false)
	const [isHovering, setIsHovering] = useState(false)

	useEffect(() => {
		applyFormatting()
	}, [])

	function handleMouseEnter() {
		if (!isFocused) {
			removeFormatting()
		}
		setIsHovering(true)
	}
	function handleMouseLeave() {
		if (!isFocused) {
			applyFormatting()
		}
		setIsHovering(false)
	}
	function handleBlur() {
		if (!isHovering) {
			applyFormatting()
		}
		setIsFocused(false)
	}
	function handleFocus() {
		if (!isHovering) {
			removeFormatting()
		}
		setIsFocused(true)
	}

	function applyFormatting() {
		const unroundedVal = inputRef.current!.value
		const numVal = parseFloat(unroundedVal)
		const roundedVal = numVal.toFixed(2)

		inputRef.current!.dataset.rawValue = roundedVal

		let formattedVal = addCommasToNumber(roundedVal)

		// if (numVal < 0) {
		// 	formattedVal = `(${formattedVal.slice(1)})`
		// }

		inputRef.current!.type = 'text'
		inputRef.current!.value = formattedVal
	}

	function addCommasToNumber(numberString: string) {
		// Split the string into the whole number and decimal parts
		let [wholePart, decimalPart] = numberString.split('.')

		// Use a regular expression to add commas to the whole number part
		wholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

		// Reassemble the whole number and decimal parts (if present)
		return decimalPart ? `${wholePart}.${decimalPart}` : wholePart
	}

	function removeFormatting() {
		console.log('    removeFormatting ran')
		const rawValue = inputRef.current!.dataset.rawValue

		inputRef.current!.type = 'number'
		if (rawValue !== '' && rawValue !== undefined) {
			inputRef.current!.value = rawValue
		}
	}

	return (
		<div className={s.main}>
			<span className={s.dollar_symbol}>$</span>
			<span className={s.formatted}>123.45</span>
			<input
				{...props}
				ref={inputRef}
				type='text'
				step={0.01}
				onBlur={handleBlur}
				onFocus={handleFocus}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				data-raw-value={props.value}
			/>
		</div>
	)
}
