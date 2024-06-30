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
			let headers=res.headers;
			res=new Response(await res.blob());
			for(let [k,v] of headers)res.headers.set(k, v);
			//res.headers=new Headers(headers);
		}catch(err){
			res=new Response('失败');
		}
	}
	res.headers.set('Access-Control-Allow-Origin', '*');
	//res.headers.set('Cache-Control', 'no-store');
	return res
}