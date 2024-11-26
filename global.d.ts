namespace Transaction {
	type ID = string
	interface Bare {
		name: string
		date: string
		items: TransactionItem.WithPropsAndID[]
	}
	interface WithProps extends Bare {
		order_position: number
	}
	interface BareWithID extends Bare {
		id: ID
	}
	interface WithPropsAndUser extends WithProps {
		user_id: string
	}
	interface WithPropsAndID extends WithProps {
		id: ID
	}
	interface Full extends WithPropsAndUser {
		id: ID
	}
}
namespace TransactionItem {
	type ID = string
	interface Bare {
		name: string
		amount: number
		category_id: Category.ID | null
		account_id: Account.ID | null
		transaction_id: Transaction.ID
	}
	interface WithProps extends Bare {
		order_position: number
	}
	interface BareWithID extends Bare {
		id: ID
	}
	interface WithPropsAndUser extends WithProps {
		user_id: string
	}
	interface WithPropsAndID extends WithProps {
		id: ID
	}
	interface Full extends WithPropsAndUser {
		id: ID
	}
}
