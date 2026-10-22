function showLink(el, href){
	el.innerHTML = ''
	let a = document.createElement('a')
	a.href = a.textContent = href
	el.append(a)
}

let infoSetters = {
	name(data){
		this.textContent = data
	},
	phone(data){
		this.textContent = data
	},
	qq(data){
		this.textContent = data
	},
	tieba(data){
		showLink(this, 'https://tieba.baidu.com/home/main?un='+data)
	},
	pixiv(data){
		showLink(this, 'https://www.pixiv.net/users/'+data)
	},
	x(data){
		showLink(this, 'https://x.com/'+data)
	}
}

function mergeInfo(){
	let data = localStorage.getItem('about')
	data = data ? JSON.parse(data) : {}
	let params = new URLSearchParams(location.search)
	for(let k in infoSetters){
		let v = params.get(k)
		if(v)
			data[k] = v //非空字符串
		else if(v=='')
			delete data[k]
	}
	localStorage.setItem('about', JSON.stringify(data))
	return data
}

function mystery(key){
	let ciphertext = [3, 2, 25, 24, 5, 7]
	let plaintext = new Uint8Array(6)
	for(let i=0; i<6; i++){
		let offset = (key >> (i * 5)) & 0x1f
		plaintext[i] = (ciphertext[i] + offset) % 26 + 97
	}
	return new TextDecoder().decode(plaintext)
}

let info = mergeInfo()
for(let k in infoSetters){
	let data = info[k]
	let el = document.getElementById('h-'+k)
	if(data)
		infoSetters[k].call(el, data)
	else
		el.classList.add('hidden')
}

if(info.pixiv){
	let subdomain = mystery(parseInt(info.pixiv))
	let a = document.createElement('a')
	a.textContent = '神秘入口'
	a.href = `https://${subdomain}.x-ze.cn/`
	let nav = document.querySelector('#global-topbar > .nav')
	nav.append(a)
}

fetch('/about-verify', {method:'POST', body:JSON.stringify(info)})
	.then(r=>r.json())
	.then(res=>{
		if(res.flag==0||res.flag==1)
			alert('当前显示的信息与真实信息不符，你可能访问了错误的链接。')
	})

