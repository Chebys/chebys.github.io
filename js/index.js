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
		if(v)data[k] = v //只能是非空字符串
	}
	localStorage.setItem('about', JSON.stringify(data))
	return data
}

function main(){
	let info = mergeInfo()
	/* 可以通过
	fetch('/about-verify', {method:'POST',body:JSON.stringify(info)}).then(r=>r.json()).then(console.log)
	来检验是否正确 */
	for(k in infoSetters){
		let data = info[k]
		let el = document.getElementById('h-'+k)
		if(data){
			infoSetters[k].call(el, data)
		}else{
			el.classList.add('hidden')
		}
	}
}

window.addEventListener('load', main)