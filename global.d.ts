type UID = string
namespace Account {
	type ID = string
	interface Bare {
		name: string
		starting_amount: number
	}
	interface WithProps extends Bare {
		order_position: number
	}
	interface BareWithID extends Bare {
		id: ID
	}
	interface WithPropsAndUser extends WithProps {
		user_id: UID
	}
	interface WithPropsAndID extends WithProps {
		id: ID
	}
	interface Full extends WithPropsAndUser {
		id: ID
	}
}
namespace Category {
	type ID = string
	interface Bare {
		name: string
	}
	interface WithProps extends Bare {
		order_position: number
	}
	interface BareWithID extends Bare {
		id: ID
	}
	interface WithPropsAndUser extends WithProps {
		user_id: UID
	}
	interface WithPropsAndID extends WithProps {
		id: ID
	}
	interface Full extends WithPropsAndUser {
		id: ID
	}
}
