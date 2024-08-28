import { ReadonlyURLSearchParams } from 'next/navigation'

interface ErrorPageParams {
	message?: string
}

export default function ErrorPage({ searchParams }: { searchParams: ErrorPageParams }) {
	console.log(searchParams)
	const message = searchParams?.message || 'Unknown error'

	return (
		<div>
			<h1>Error Page</h1>
			<p>{message || 'Unknown error'}</p>
		</div>
	)
}
