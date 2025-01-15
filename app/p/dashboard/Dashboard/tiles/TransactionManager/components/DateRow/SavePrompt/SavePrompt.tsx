import { JButton } from '@/components/JForm'
import s from './SavePrompt.module.scss'
import { useEffect, useRef, useState } from 'react'
import { createFocusLoop } from '@/utils'
interface SavePromptProps {
	closePopup: () => void
	afterSave: () => void
	handleSave: () => Promise<void>
}
export function SavePrompt({ closePopup, afterSave, handleSave }: SavePromptProps) {
	const [saving, setSaving] = useState(false)
	const firstNodeRef = useRef<HTMLButtonElement>(null)
	const lastNodeRef = useRef<HTMLButtonElement>(null)
	const firstLoadRef = useRef(true)

	useEffect(() => {
		let cleanup = () => {}
		if (firstNodeRef.current && lastNodeRef.current) {
			const loop = createFocusLoop(firstNodeRef.current, lastNodeRef.current)
			if (loop) {
				cleanup = loop.clearLoops
			}
			if (firstLoadRef.current) {
				firstLoadRef.current = false
				firstNodeRef.current.focus()
			}
		}
		return cleanup
	}, [firstNodeRef.current, lastNodeRef.current, firstLoadRef.current])

	return (
		<div className={s.main}>
			<p>
				You'll have to save your changes before creating a new transaction.
				<br /> This is temporary, this will soon be updated to support inline
				transaction creation.
			</p>
			<p>Would you like to save your changes?</p>
			<div style={{ display: 'flex', gap: '10px' }}>
				<JButton jstyle='secondary' onClick={closePopup} ref={firstNodeRef}>
					Go Back
				</JButton>
				<JButton
					jstyle='primary'
					loading={saving}
					onClick={async () => {
						setSaving(true)
						await handleSave()
						afterSave()
						closePopup()
					}}
					ref={lastNodeRef}
				>
					Save
				</JButton>
			</div>
		</div>
	)
}
