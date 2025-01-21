import { JButton } from '@/components/JForm'
import s from './DiscardConfirmPopup.module.scss'
import { useLayoutEffect, useRef } from 'react'
import { createFocusLoop } from '@/utils'

export function DiscardConfirmPopup({
	onBackout,
	onConfirm,
}: {
	onBackout: () => void
	onConfirm: () => void
}) {
	const noBtnNodeRef = useRef<HTMLButtonElement>(null)
	const yesBtnNodeRef = useRef<HTMLButtonElement>(null)

	useLayoutEffect(() => {
		if (yesBtnNodeRef.current && noBtnNodeRef.current) {
			yesBtnNodeRef.current.focus()
			createFocusLoop(noBtnNodeRef.current, yesBtnNodeRef.current)
		}
	}, [])
	return (
		<div className={s.main}>
			<h3>Discard Changes</h3>
			<p>Are you sure?</p>
			<div style={{ display: 'flex', gap: '10px' }}>
				<JButton ref={noBtnNodeRef} jstyle='secondary' onClick={onBackout}>
					No
				</JButton>
				<JButton ref={yesBtnNodeRef} jstyle='primary' onClick={onConfirm}>
					Yes
				</JButton>
			</div>
		</div>
	)
}
