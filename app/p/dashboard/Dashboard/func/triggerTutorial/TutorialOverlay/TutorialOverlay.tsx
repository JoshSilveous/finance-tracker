import { useEffect, useState } from 'react'
import s from './TutorialOverlay.module.scss'
import { delay } from '@/utils'
export function TutorialOverlay({ close }: { close: () => void }) {
	const [highlightedArea, setHighlightedArea] = useState({
		top: 0,
		left: 0,
		width: 0,
		height: 0,
	})
	useEffect(() => {
		delay(1000).then(() => {
			setHighlightedArea({ top: 50, left: 50, width: 600, height: 200 })
		})
	}, [])
	return (
		<div className={s.container}>
			Helloooo!
			<div className={s.cutout} style={{ ...highlightedArea }}></div>
			<div className={s.content}>
				<button onClick={close}>Close me!</button>
			</div>
		</div>
	)
}
