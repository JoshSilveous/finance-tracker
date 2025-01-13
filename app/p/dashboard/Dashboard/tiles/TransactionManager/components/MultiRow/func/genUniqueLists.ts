import { MultiRowProps } from '../MultiRow'

export function genUniqueLists(p: MultiRowProps) {
	const uniqueCategories = (() => {
		const arr: string[] = []
		Object.values(p.transaction.items).forEach((item) => {
			if (item.category_id.val !== '') {
				const categoryName = p.dropdownOptions.category.find(
					(cat) => cat.value === item.category_id.val
				)!.name
				if (arr.findIndex((item) => item === categoryName) === -1) {
					arr.push(categoryName)
				}
			}
		})
		return arr.join(', ')
	})()
	const uniqueAccounts = (() => {
		const arr: string[] = []
		Object.values(p.transaction.items).forEach((item) => {
			if (item.account_id.val !== '') {
				const accountName = p.dropdownOptions.account.find(
					(act) => act.value === item.account_id.val
				)!.name
				if (arr.findIndex((item) => item === accountName) === -1) {
					arr.push(accountName)
				}
			}
		})
		return arr.join(', ')
	})()

	return { categories: uniqueCategories, accounts: uniqueAccounts }
}
