import KVRequestHandler from './utils/simple-kv'

export async function onRequest({env, request}){
	let handler = new KVRequestHandler(env.KV, {keyname:'filename'})
	return handler.handle(request)
}