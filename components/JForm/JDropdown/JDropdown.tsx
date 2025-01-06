import { DetailedHTMLProps, forwardRef, SelectHTMLAttributes } from 'react'
import s from './JDropdown.module.scss'
import { default as DropdownArrow } from '@/public/dropdown_arrow.svg'
import { default as LoadingAnim } from '@/public/loading.svg'

export namespace JDropdownTypes {
	export interface Props
		extends DetailedHTMLProps<
			SelectHTMLAttributes<HTMLSelectElement>,
			HTMLSelectElement
		> {
		options: Option[]
		placeholder?: string
		className?: string
		loading?: boolean
	}
	export interface Option {
		name: string
		value: string | number
	}
}

export const JDropdown = forwardRef<HTMLSelectElement, JDropdownTypes.Props>(
	({ options, placeholder, className, loading, multiple, ...rest }, ref) => {
		const optionsDisplay = options.map((option, index) => {
			return (
				<option value={option.value} key={index}>
					{option.name}
				</option>
			)
		})
		if (rest.value === undefined && multiple !== true) {
			optionsDisplay.unshift(
				<option value='' key={-1}>
					{placeholder ? placeholder : ''}
				</option>
			)
		}
		return (
			<div
				className={`${s.main} ${multiple ? s.multiple : ''} ${
					className ? className : ''
				}`}
			>
				{loading && (
					<div className={s.loading}>
						<LoadingAnim />
					</div>
				)}
				<select ref={ref} multiple={multiple} {...rest}>
					{loading ? '' : optionsDisplay}
				</select>
				{multiple !== true && (
					<div className={s.custom_arrow}>
						<DropdownArrow />
					</div>
				)}
			</div>
		)
	}
)
JDropdown.displayName = 'JDropdown'
