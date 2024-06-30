export async function onRequest(context){
	const msg_h='chebys.pages.dev/proxy: ';
	//const url=new URL(context.request.url);
	//const get=p=>url.searchParams.get(p);
	var tURL, res=null;
	var target=context.request.url.match(/\?url=(.+)/)?.[1];
	function error_res(msg){
		res=new Response(msg_h+msg);
	}
	
	if(!target){
		error_res('url missing');
	}else{
		try{
			tURL=new URL(target);
			res=await fetch(tURL);
			let headers=res.headers;
			res=new Response(await res.blob());
			for(let [k,v] of headers)res.headers.set(k, v);
		}catch(e){
			if(!tURL)error_res('invalid url');
			else if(res===null)error_res('failed to fetch');
			else error_res('error');
		}
	}
	
	res.headers.set('Access-Control-Allow-Origin', '*');
	//res.headers.set('Cache-Control', 'no-store');
	return res
}