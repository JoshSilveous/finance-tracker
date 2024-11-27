import { ChangeEvent } from 'react'
import s from './JDropdown.module.scss'
import { default as DropdownArrow } from '@/public/dropdown_arrow.svg'
import { default as LoadingAnim } from '@/public/loading.svg'

export namespace JDropdownTypes {
	export interface Props {
		options: Option[]
		onChange?: ChangeEventHandler
		defaultValue?: string | number
		placeholder?: string
		className?: string
		loading?: boolean
	}
	export interface Option {
		name: string
		value: string | number
	}
	export type ChangeEventHandler = (e: ChangeEvent<HTMLSelectElement>) => void
}

export function JDropdown(props: JDropdownTypes.Props) {
	const optionsDisplay = props.options.map((option) => {
		return <option value={option.value}>{option.name}</option>
	})
	if (props.defaultValue === undefined) {
		optionsDisplay.unshift(
			<option value=''>{props.placeholder ? props.placeholder : ''}</option>
		)
	}
	return (
		<div className={`${s.main} ${props.className ? props.className : ''}`}>
			{props.loading && (
				<div className={s.loading}>
					<LoadingAnim />
				</div>
			)}
			<select onChange={props.onChange} defaultValue={props.defaultValue}>
				{props.loading ? '' : optionsDisplay}
			</select>
			<div className={s.custom_arrow}>
				<DropdownArrow />
			</div>
		</div>
	)
}
