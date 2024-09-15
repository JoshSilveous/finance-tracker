import {
	ChangeEvent,
	FocusEvent,
	InputHTMLAttributes,
	MouseEvent,
	useEffect,
	useRef,
	useState,
} from 'react'
import s from './JNumberAccounting.module.scss'

interface JNumberAccountingProps extends InputHTMLAttributes<HTMLInputElement> {}

export default function JNumberAccounting(props: JNumberAccountingProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const displayRef = useRef<HTMLDivElement>(null)
	const [showParenthesis, setShowParenthesis] = useState(false)
	const [isFocused, setIsFocused] = useState(false)
	const [isHovering, setIsHovering] = useState(false)
	const [prevVal, setPrevVal] = useState(props.value ? (props.value as string) : '')

	useEffect(() => {
		updateDisplayText()
	}, [])

	function updateDisplayText() {
		const valFloat = parseFloat(inputRef.current!.value)
		if (isNaN(valFloat)) {
			inputRef.current!.value = prevVal
			updateDisplayText()
		} else {
			const valRounded = valFloat.toFixed(2)
			inputRef.current!.value = valRounded

			let newDisplayVal = addCommas(valRounded)

			if (valFloat < 0) {
				newDisplayVal = newDisplayVal.slice(1)
				setShowParenthesis(true)
			} else {
				setShowParenthesis(false)
			}

			displayRef.current!.innerText = newDisplayVal
		}
	}

	function handleMouseEnter(e: MouseEvent<HTMLInputElement>) {
		setIsHovering(true)
		if (props.onMouseEnter) {
			props.onMouseEnter(e)
		}
	}
	function handleMouseLeave(e: MouseEvent<HTMLInputElement>) {
		setIsHovering(false)
		if (props.onMouseLeave) {
			props.onMouseLeave(e)
		}
	}
	function handleBlur(e: FocusEvent<HTMLInputElement>) {
		setIsFocused(false)
		updateDisplayText()
		if (props.onBlur) {
			props.onBlur(e)
		}
	}
	function handleFocus(e: FocusEvent<HTMLInputElement>) {
		setIsFocused(true)
		setPrevVal(e.target.value)
		if (props.onFocus) {
			props.onFocus(e)
		}
	}
	function handleChange(e: ChangeEvent<HTMLInputElement>) {
		if (props.onChange) {
			props.onChange(e)
		}
	}

	function addCommas(numberString: string) {
		let [wholePart, decimalPart] = numberString.split('.')
		wholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
		return decimalPart ? `${wholePart}.${decimalPart}` : wholePart
	}

	const showFormatted = !(isHovering || isFocused)

	return (
		<div className={`${s.main} ${props.className ? props.className : ''}`}>
			<span className={s.dollar_symbol}>$</span>
			<div className={s.left_parenthesis} hidden={!(showParenthesis && showFormatted)}>
				(
			</div>
			<div className={s.formatted} hidden={!showFormatted} ref={displayRef} />
			<input
				{...props}
				ref={inputRef}
				type='number'
				step={0.01}
				onChange={handleChange}
				onBlur={handleBlur}
				onFocus={handleFocus}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				style={showFormatted ? { color: 'transparent' } : {}}
			/>
			<div
				className={s.right_parenthesis}
				hidden={!(showParenthesis && showFormatted)}
			>
				)
			</div>
		</div>
	)
}
