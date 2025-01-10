'use client'
import s from './FeedbackPopup.module.scss'
import { createFocusLoop, delay } from '@/utils'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { JButton } from '../JForm'
import { submitFeedback } from '@/database'

interface FeedbackPopupProps {
	closePopup: () => void
	feedbackSource: string
	header: string
}
export function FeedbackPopup({ closePopup, feedbackSource, header }: FeedbackPopupProps) {
	const [submitting, setSubmitting] = useState(false)
	const [submitted, setSubmitted] = useState(false)
	const [val, setVal] = useState('')
	const textboxRef = useRef<HTMLTextAreaElement>(null)
	const lastFocusRef = useRef<HTMLButtonElement>(null)
	useEffect(() => {
		createFocusLoop({ firstRef: textboxRef, lastRef: lastFocusRef })
	}, [textboxRef.current, lastFocusRef.current])
	useLayoutEffect(() => {
		delay(20).then(() => {
			textboxRef.current!.focus()
		})
	}, [])

	const submit = async () => {
		setSubmitting(true)
		await submitFeedback(val, feedbackSource)
		setSubmitting(false)
		setSubmitted(true)
	}
	useEffect(() => {
		if (submitted) {
			lastFocusRef.current?.focus()
		}
	}, [submitted])

	return (
		<div className={s.main}>
			{submitted ? (
				<div className={s.thanks}>Feedback successfully submitted, thank you!</div>
			) : (
				<>
					<div className={s.header}>{header}</div>
					<div className={s.appreciation_container}>
						Any feedback is appreciated :)
					</div>
					<div className={s.textbox_container}>
						<textarea
							ref={textboxRef}
							placeholder='Wow josh this site is like super cool'
							value={val}
							onChange={(e) => {
								setVal(e.currentTarget.value)
							}}
						/>
					</div>
				</>
			)}
			<div className={s.button_container}>
				<JButton
					jstyle='secondary'
					onClick={closePopup}
					ref={submitted ? lastFocusRef : undefined}
				>
					Go Back
				</JButton>
				{!submitted && (
					<JButton
						jstyle='primary'
						onClick={submit}
						disabled={!val.length}
						loading={submitting}
						ref={submitted ? undefined : lastFocusRef}
					>
						Submit
					</JButton>
				)}
			</div>
		</div>
	)
}
