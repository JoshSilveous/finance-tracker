export { createPopup } from './createPopup/createPopup'
export { createErrorPopup } from './errors/createErrorPopup'
export { isStandardError } from './errors/isStandardError'
export { removeFromArray } from './removeFromArray/removeFromArray'
export {
	createClient as clientCreateClient,
	getUserID as clientGetUserID,
} from './supabase/client'
export {
	createClient as serverCreateClient,
	getUserID as serverGetUserID,
} from './supabase/server'
export { updateSession } from './supabase/middleware'
export { createPreferencesEntry } from './supabase/newUserPropegation'
