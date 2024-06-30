export async function onRequest(context){
	const url=new URL(context.request.url);
	const get=p=>url.searchParams.get(p)
	const target=get('url')
	var res;
	if(!target){
		res=new Response('缺少url');
	}else{
		try{
			res=await fetch(target);
			res.headers=new Headers(res.headers); //immutable headers
		}catch(err){
			res=new Response('失败');
		}
	}
	res.headers.set('Access-Control-Allow-Origin', '*');
	//res.headers.set('Cache-Control', 'no-store');
	return res
}