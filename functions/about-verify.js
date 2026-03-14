let MSG = {
	'-2': '出错了，可能是格式有误',
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
	let flag
	try{
		let data = await request.json()
		flag = await verify(env.KV_about, data)
	}catch(err){
		flag = -2
	}

	return new Response(JSON.stringify({
		flag,
		message: MSG[flag]
	}))
}