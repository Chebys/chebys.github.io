export async function onRequest(context){
	const metakey='transferer'
	const url=new URL(context.request.url);
	const get=p=>url.searchParams.get(p)
	const filename=get('filename'), mode=get('mode')
	const KV=context.env.KV_transferer
	var res
	
	if(mode=='getlist'){
		res=JSON.stringify(await KV.list())
	}else if(mode=='set'){
		let value=await context.request.text();
		res='succeeded';
		await KV.put(filename, value)
			.catch(err=>{res='failed'})
	}else if(mode=='delete'){
		KV.delete(filename)
		res='succeeded'
	}else{
		res=await KV.get(filename)
	}
	var response=new Response(res)
	response.headers.set('Access-Control-Allow-Origin', '*');
	response.headers.set('Cache-Control', 'no-store');
	return response
}