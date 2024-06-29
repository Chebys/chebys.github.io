export function onRequest(context){
	const url=new URL(context.request.url);
	const k=url.searchParams.get('k')
	const res=context.env.KV.get('PRIME')
	//return context.env.ASSETS.fetch('/The Corruption/')
	return new Response(res)
}