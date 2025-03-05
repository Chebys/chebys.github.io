export async function onRequest({env, request}){
	const metakey = 'transferer'
	const url = new URL(request.url);
	const get = p=>url.searchParams.get(p)
	const filename = get('filename'), mode = get('mode')
	const KV = env.KV_transferer
	var res
	
	if(mode=='getlist'){
		res = JSON.stringify(await KV.list())
	}else if(mode=='test'){
		//
	}else{
		if(filename){
			if(mode=='set'){
				res = 'set succeeded'
				await KV.put(filename, request.body)
					.catch(err => {res = err.toString()})
			}else if(mode=='delete'){
				await KV.delete(filename)
				res = 'delete succeeded'
			}else{
				res = await KV.get(filename, 'stream')
			}
		}else{
			res = '缺少filename'
		}
	}

	var response = new Response(res)
	response.headers.set('Access-Control-Allow-Origin', '*')
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
	response.headers.set('Cache-Control', 'no-store')
	return response
}