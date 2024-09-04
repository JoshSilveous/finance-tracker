import {
	ChangeEvent,
	ChangeEventHandler,
	InputHTMLAttributes,
	useEffect,
	useRef,
	useState,
} from 'react'
import s from './JNumberAccounting.module.scss'

interface JNumberAccountingProps extends InputHTMLAttributes<HTMLInputElement> {}

export default function JNumberAccounting(props: JNumberAccountingProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const handleBlur: ChangeEventHandler<HTMLInputElement> = (e) => {
		const oldVal = e.target.value
		const newVal = parseFloat(oldVal).toFixed(2)
		console.log('oldVal:', oldVal, typeof oldVal)
		console.log('newVal:', newVal, typeof newVal)
		e.target.value = newVal
	}

	useEffect(() => {
		inputRef.current!.value = parseFloat(inputRef.current!.value).toFixed(2)
	}, [])

	return (
		<div className={s.main}>
			<span className={s.dollar_symbol}>$</span>
			<input ref={inputRef} {...props} type='number' step={0.01} onBlur={handleBlur} />
		</div>
	)
}
