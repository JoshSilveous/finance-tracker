'use client'
import {
	ChangeEvent,
	FocusEvent,
	InputHTMLAttributes,
	MouseEvent,
	useEffect,
	useRef,
	useState,
} from 'react'
import { addCommas, delay } from '@/utils'
import s from './JNumberAccounting.module.scss'
import { evaluate } from 'mathjs'

interface JNumberAccountingProps extends InputHTMLAttributes<HTMLInputElement> {
	minimalStyle?: boolean
	maxDigLeftOfDecimal?: number
	maxDigRightOfDecimal?: number
}

export function JNumberAccounting(props: JNumberAccountingProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const displayRef = useRef<HTMLDivElement>(null)
	const [showParenthesis, setShowParenthesis] = useState(false)
	const [isFocused, setIsFocused] = useState(false)
	const [isHovering, setIsHovering] = useState(false)
	const [prevVal, setPrevVal] = useState(props.value ? (props.value as string) : '')
	useEffect(() => {
		updateDisplayText()
	}, [props.value])

	// adds error class to input, if errors are stacking it will remain until 0.5s after they stop stacking
	let errorEffectQueue = 0
	async function runErrorEffect() {
		errorEffectQueue++
		if (errorEffectQueue === 1) {
			let prevErrorEffectQueue = errorEffectQueue
			while (errorEffectQueue > 0) {
				containerRef.current!.classList.add(s.error)
				await delay(300)
				if (errorEffectQueue === prevErrorEffectQueue) {
					errorEffectQueue = 0
					containerRef.current!.classList.remove(s.error)
				}
				errorEffectQueue--
				prevErrorEffectQueue = errorEffectQueue
			}
		}
	}

	function updateDisplayText() {
		const valFloat = Number(inputRef.current!.value)
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
		e.target.value = parseFloat(evaluate(e.target.value)).toFixed(2)
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
		const input = e.target.value
		const prevInput = e.target.dataset['val_before_change']!
		let sanitizedInput = input.replace(/[^0-9+\-./*()]/g, '')

		if (input !== sanitizedInput) {
			runErrorEffect()
		}

		let [digLeft, digRight = 0] = sanitizedInput.split('.').map((it) => it.length)

		if (
			(props.maxDigLeftOfDecimal !== undefined &&
				digLeft > props.maxDigLeftOfDecimal) ||
			(props.maxDigRightOfDecimal !== undefined &&
				digRight > props.maxDigRightOfDecimal)
		) {
			runErrorEffect()
			sanitizedInput = prevInput
		}

		if (props.onChange && sanitizedInput !== prevInput) {
			props.onChange(e)
		}
		e.target.value = sanitizedInput
		e.target.dataset['input_before_change'] = sanitizedInput
	}

	const showFormatted = !(isHovering || isFocused)

	return (
		<div
			className={`${s.main} ${props.className ? props.className : ''} ${
				props.minimalStyle ? s.minimal_style : ''
			} ${props.disabled ? s.disabled : ''}`}
			ref={containerRef}
		>
			<span className={s.dollar_symbol}>$</span>
			<div className={s.left_parenthesis} hidden={!(showParenthesis && showFormatted)}>
				(
			</div>
			<div className={s.formatted} hidden={!showFormatted} ref={displayRef} />
			<input
				{...props}
				ref={inputRef}
				type='text'
				onChange={handleChange}
				onBlur={handleBlur}
				onFocus={handleFocus}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				data-val_before_change={props.value ? props.value : ''}
				style={
					showFormatted
						? { color: 'transparent', userSelect: 'none' }
						: { color: 'inherit' }
				}
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
