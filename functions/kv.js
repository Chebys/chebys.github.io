export async function onRequest(context){
	const url=new URL(context.request.url);
	const get=p=>url.searchParams.get(p)
	const key=get('key'), mode=get('mode'), value=null, res=null
	if(mode=='set'){
		value=context.request.text()||'asdasd';
		res=(await context.env.KV.put(key, value))?'成功':'失败';
	}else{
		res=await context.env.KV.get('PRIME')
	}
	//return context.env.ASSETS.fetch('/The Corruption/')
	return new Response(res)
}