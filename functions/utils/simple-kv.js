let defaultHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'Content-Type',
	'Cache-Control': 'no-store'
}

class KVRequestHandler{
	constructor(kv, config={}){
		this.kv = kv
		this.keyname = config.keyname || 'key'
		this.headers = config.headers || defaultHeaders
	}
	async handle(req){
		let params = new URL(request.url).searchParams;
		let key = params.get(this.keyname), mode = params.get('mode')

		let res
		if(mode=='getlist'){
			res = JSON.stringify(await this.kv.list())
		}else if(key){
			if(mode=='set'){
				res = 'set succeeded'
				await this.kv.put(key, request.body)
					.catch(err => {res = err.toString()})
			}else if(mode=='delete'){
				await this.kv.delete(key)
				res = 'delete succeeded'
			}else{
				res = await this.kv.get(key, 'arrayBuffer')
			}
		}else{
			res = '缺少 ' + this.keyname
		}

		return new Response(res, {
			headers: this.headers
		})
	}
}

export default KVRequestHandler