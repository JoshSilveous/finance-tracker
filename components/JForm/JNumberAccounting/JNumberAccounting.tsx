import { InputHTMLAttributes, useCallback, useEffect, useRef, useState } from 'react'
import s from './JNumberAccounting.module.scss'
import { addCommas, delay } from '@/utils'

interface JNumberAccountingProps extends InputHTMLAttributes<HTMLInputElement> {
	maxDigLeftOfDecimal?: number
	maxDigRightOfDecimal?: number
	minimalStyle?: boolean
	value: string | number
}

export function JNumberAccounting({
	maxDigLeftOfDecimal,
	maxDigRightOfDecimal = 2,
	minimalStyle,
	className,
	value: propValue,
	onChange: propsOnChange,
	onFocus: propsOnFocus,
	onBlur: propsOnBlur,
	...rest
}: JNumberAccountingProps) {
	const inputRef = useRef<HTMLInputElement | null>(null)
	const containerRef = useRef<HTMLDivElement | null>(null)
	const [value, setValue] = useState('')
	const valueRef = useRef<string | null>(null)
	const [isHovering, setIsHovering] = useState(false)
	const [isFocused, setIsFocused] = useState(false)

	useEffect(() => {
		if (isFocused) {
			inputRef.current!.focus()
		}
	}, [isFocused])
	useEffect(() => {
		valueRef.current = value
	}, [value])
	useEffect(() => {
		setValue(typeof propValue === 'number' ? propValue.toString() : propValue)
	}, [propValue])

	let errorEffectQueue = 0
	const errorEffect = useCallback(async () => {
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
	}, [errorEffectQueue])

	const onChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newVal = e.target.value
			if (newVal !== '' && validate(newVal) === false) {
				errorEffect()
				return
			}

			const [left, right] = newVal.split('.')
			if (
				(maxDigLeftOfDecimal !== undefined &&
					left.replace(/-/g, '').length > maxDigLeftOfDecimal) ||
				(right !== undefined && right.length > maxDigRightOfDecimal)
			) {
				errorEffect()
			} else {
				setValue(newVal)
				if (propsOnChange !== undefined) {
					propsOnChange(e)
				}
			}
		},
		[maxDigLeftOfDecimal, maxDigRightOfDecimal]
	)

	const validate = useCallback((val: string) => {
		// Check if the value only contains numbers, '-', or '.'
		if (!/^[0-9.-]+$/.test(val)) {
			console.log('fail 1')
			return false
		}

		// Check if it contains only ONE or ZERO of '-' and '.'
		if (/([-].*[-])|([.].*[.])/.test(val)) {
			console.log('fail 2')
			return false
		}

		// Check if '-' is present NOT at the front of the string
		if (/.+-.*|^.*[^-]-.*$/.test(val)) {
			console.log('fail 3')
			return false
		}

		return true
	}, [])

	const onFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
		setIsFocused(true)
		if (propsOnFocus !== undefined) {
			propsOnFocus(e)
		}
	}, [])
	const onBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
		setIsFocused(false)
		if (valueRef.current !== Number(valueRef.current!).toFixed(2)) {
			setValue((prev) => Number(prev).toFixed(2))
		}

		if (propsOnBlur !== undefined) {
			propsOnBlur(e)
		}
	}, [])

	return (
		<div
			className={`${s.main} ${
				(isHovering || isFocused) && !rest.disabled ? s.reveal_input : ''
			} ${minimalStyle ? s.minimal_style : ''} ${rest.disabled ? s.disabled : ''} ${
				className ? className : ''
			}`}
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => setIsHovering(false)}
			ref={containerRef}
		>
			<input
				type='text'
				onChange={onChange}
				value={value}
				ref={inputRef}
				onFocus={onFocus}
				onBlur={onBlur}
				{...rest}
			/>
			<div className={s.formatted} tabIndex={0} onFocus={() => setIsFocused(true)}>
				<div>{addCommas(value.replace(/-/g, ''))}</div>
			</div>
			<div className={s.decals}>
				<div className={s.dollar_symbol}>$</div>
				<div className={s.left_parenthesis}>{/-\d+/.test(value) ? '(' : ''}</div>
				<div className={s.right_parenthesis}>{/-\d+/.test(value) ? ')' : ''}</div>
			</div>
		</div>
	)
}
