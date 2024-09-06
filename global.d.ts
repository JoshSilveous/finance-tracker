interface Account {
	id: string
	name: string
	starting_amount: number
}
interface AccountFull extends Account {
	user_id: string
}
