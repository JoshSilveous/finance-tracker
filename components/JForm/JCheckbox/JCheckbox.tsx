import {
	DetailedHTMLProps,
	forwardRef,
	InputHTMLAttributes,
	useCallback,
	useState,
} from 'react'
import s from './JCheckbox.module.scss'
import { default as CheckmarkIcon } from '@/public/checkmark.svg'

interface JCheckboxProps
	extends Omit<
		DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
		'type'
	> {
	/**
	 * background color is required to be explicitly defined because the checkmark's `color` attribute cannot inherit `background-color`.
	 */
	bgColor: string
}
export const JCheckbox = forwardRef<HTMLInputElement, JCheckboxProps>(
	({ bgColor, style, onChange: propsOnChange, ...rest }, ref) => {
		const [isChecked, setIsChecked] = useState(
			rest.checked !== undefined ? rest.checked : false
		)

		const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
			setIsChecked(e.target.checked)
			if (propsOnChange !== undefined) {
				propsOnChange(e)
			}
		}, [])
		return (
			<div className={s.main}>
				<input
					type='checkbox'
					ref={ref}
					style={{ backgroundColor: bgColor, ...style }}
					onChange={onChange}
					{...rest}
				/>
				<div
					style={{ color: bgColor }}
					className={`${s.checkmark_container} ${isChecked ? s.checked : ''}`}
				>
					<CheckmarkIcon />
				</div>
			</div>
		)
	}
)
JCheckbox.displayName = 'JCheckbox'
