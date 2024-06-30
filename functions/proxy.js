export async function onRequest(context){
	const url=new URL(context.request.url);
	const get=p=>url.searchParams.get(p)
	const target=get('url')
	
	if(!target){
		res='缺少url';
	}else{
		try{
			res=await fetch(target);
			res=await res.text();
		}catch(err){
			res='失败';
		}
	}
	var response=new Response(res);
	response.headers.set('Access-Control-Allow-Origin', '*');
	//response.headers.set('Cache-Control', 'no-store');
	return response
}