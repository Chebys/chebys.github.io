import KVRequestHandler from './utils/simple-kv'

export async function onRequest({env, request}){
	let handler = new KVRequestHandler(env.KV_transferer, {keyname:'filename'})
	return handler.handle(request)
}