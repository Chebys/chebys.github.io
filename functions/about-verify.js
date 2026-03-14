let MSG = {
	'-1': '啥都没有',
	'0': '完全错误',
	'1': '部分正确',
	'2': '完全正确'
}

async function verify(kv, data){
	let list = Object.keys(data)
	if(!list.length)
		return -1
	let realData = await kv.get(list)
	let flag_true = false, flag_false = false
	for(let k of list){
		if(data[k]==realData.get(k))
			flag_true = true
		else
			flag_false = true
	}
	return flag_true
		? flag_false ? 1 : 2
		: 0
}

export async function onRequest({env, request}){
	//const KV = env.KV_transferer
	let data = await request.json()
	let flag = await verify(env.KV_about, data)

	return new Response(JSON.stringify({
		flag,
		message: MSG[flag]
	}))
}