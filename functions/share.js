function hex2bytes(str) {
    var iter = str.matchAll(/[0-9a-f]{2}/ig)
        .map(res=>parseInt(res[0], 16)) //似乎不是标准的
    return new Uint8Array(iter)
}
function decrypt257(ct, key){
    let data = new Uint8Array(ct.length)
    let m = key.length
    for(let i=0; i<ct.length; i++)
        data[i] = (ct[i]+1)*(key[i%m]+1) % 257 - 1
    return data
}
function SimpleResponse(status, msg){
	return new Response(msg, {
		status,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Cache-Control': 'no-store'
		}
	})
}
export async function onRequest(context){
	let url = new URL(context.request.url),
		params = url.searchParams,
		id = params.get('id'), //文件标识
		key = params.get('key'), //密钥（可选）
		download = params.get('download'), //attachment
		fileName = params.get('fileName'),
		mimeType = params.get('mimeType'),
		KV = context.env.KV_SHARE
	if(!id)
		return SimpleResponse(400, '缺少id')
	let data = await KV.get(id, 'arrayBuffer')
	if(data==null)
		return SimpleResponse(404, '资源不存在')
	if(key){
		key = hex2bytes(key)
		data = decrypt257(new Uint8Array(data), key)
	}
	let headers = {
		'Content-Type': mimeType || 'application/octet-stream',
		'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${fileName||id}"`,
		'Access-Control-Allow-Origin': '*',
		'Cache-Control': 'no-store'
	}
	return new Response(data, {headers})
}