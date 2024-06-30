export async function onRequest(context){
	const url=new URL(context.request.url);
	const get=p=>url.searchParams.get(p)
	const key=get('key'), mode=get('mode')
	const KV=context.env.KV
	var res
	if(!key){
		res='缺少key';
	}else if(mode=='set'){
		let value=await context.request.text();
		res='succeeded';
		await KV.put(key, value)
			.catch(err=>{res='failed'})
	}else{
		res=await KV.get(key)
	}
	var response=new Response(res)
	response.headers.set('Access-Control-Allow-Origin', '*');
	response.headers.set('Cache-Control', 'no-store');
	return response
}