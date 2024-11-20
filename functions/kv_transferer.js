import {Buffer} from 'node:buffer'

function encode(arrayBuffer){
	var buf = Buffer.from(arrayBuffer)
	return buf.toString('base64')
}
function decode(str){ //返回arrayBuffer
	var buf = Buffer.from(str, 'base64')
	return buf.buffer
}

export async function onRequest(context){
	const metakey='transferer'
	const url=new URL(context.request.url);
	const get=p=>url.searchParams.get(p)
	const filename=get('filename'), mode=get('mode')
	const KV=context.env.KV_transferer
	var res
	
	if(mode=='getlist'){
		res=JSON.stringify(await KV.list())
	}else if(mode=='test'){
		//
	}else{
		if(filename){
			if(mode=='set'){
				let arrayBuffer=await context.request.arrayBuffer()
				res='set succeeded'
				await KV.put(filename, encode(arrayBuffer))
					.catch(err=>{res='failed'})
			}else if(mode=='delete'){
				await KV.delete(filename)
				res='delete succeeded'
			}else{
				let str=await KV.get(filename)
				if(str!=null)res=decode(str)
			}
		}else{
			res='缺少filename'
		}
	}

	var response=new Response(res)
	response.headers.set('Access-Control-Allow-Origin', '*')
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
	response.headers.set('Cache-Control', 'no-store')
	return response
}