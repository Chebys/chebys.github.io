import KVRequestHandler from './utils/simple-kv'

export async function onRequest(context){
	let handler = new KVRequestHandler(context.env.KV)
	return handler.handle(context.request)
}