export function onRequest(context){
	const url=new URL(context.request.url);
	const params=url.searchParams
	//return context.env.ASSETS.fetch('/The Corruption/')
	return new Response(params.get('k'))
}