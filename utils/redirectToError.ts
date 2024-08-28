'use server'
import { redirect } from 'next/navigation'

export async function redirectToError(message: string) {
	redirect(`/error?message=${encodeURIComponent(message)}`)
}
