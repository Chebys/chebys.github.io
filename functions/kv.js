export async function onRequest(context){
	const url=new URL(context.request.url);
	const get=p=>url.searchParams.get(p)
	var key=get('key'), mode=get('mode'), value, res
	if(!key){
		res='缺少key';
	}else if(mode=='set'){
		value=await context.request.text()||'asdasd';
		res=await context.env.KV.put(key, value)?'成功':'失败';
	}else{
		res=await context.env.KV.get('PRIME')
	}
	//return context.env.ASSETS.fetch('/The Corruption/')
	var response=new Response(res)
	response.headers.set('Access-Control-Allow-Origin', '*');
	return response
}