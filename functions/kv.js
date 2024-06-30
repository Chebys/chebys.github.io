export async function onRequest(context){
	const url=new URL(context.request.url);
	const get=p=>url.searchParams.get(p)
	const key=get('key'), mode=get('mode')
	var res
	if(!key){
		res='缺少key';
	}else if(mode=='set'){
		let value=await context.request.text();
		res='succeeded';
		await context.env.KV.put(key, value)
			.catch(err=>{res='failed'})
	}else{
		res=await context.env.KV.get(key)
	}
	//return context.env.ASSETS.fetch('/The Corruption/')
	var response=new Response(res)
	response.headers.set('Access-Control-Allow-Origin', '*');
	return response
}