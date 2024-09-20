addEventListener('load',  _=>{

const url='/kv_transferer'
function KV({mode, filename, body}){
	var furl=url+'?', method='POST'
	if(mode)furl += '&mode='+mode
	if(filename)furl += '&filename='+encodeURIComponent(filename)
	return fetch(furl, {method, body})
}
async function getList(){
	var res=await KV({mode:'getlist'})
	res=await res.json() //形如{"list_complete":true,"keys":[{"name":"123"},{"name":"456"}],"cacheStatus":null}
	return res.keys.map(k=>k.name)
}
async function getFile(name){
	var res=await KV({filename:name})
	return res.text()
}
async function setFile(name, str){
	var res=await KV({mode:'set', filename:name, body:str})
	return res.text()
}
function encode(file){
	const reader = new FileReader
	return new Promise(resolve=>{
		reader.addEventListener('load', ()=>resolve(reader.result))
		reader.readAsDataURL(file)
	})
}

function downloadWithDataUrl(url, fname='未知'){
	var a=document.createElement('a')
	a.download=fname
	a.href=url
	a.click()
	a.remove()
}

function download(){ //用于下载按钮
	var fname=this.filename
	getFile(fname)
		.then(dataurl=>downloadWithDataUrl(dataurl, fname))
}
function submit(){ //用于提交按钮
	var file = this.targetfiles[0]
	encode(file)
		.then(dataurl=>setFile(file.name, dataurl))
		.then(console.log)
}

function fileContainer(filename){
	var div=document.createElement('div')
	div.innerHTML=filename
	div.classList.add('file-container')
	
	var btn=document.createElement('button')
	btn.innerHTML='下载'
	btn.filename=filename
	btn.addEventListener('click', download)
	div.append(btn)
	return div
}
function newFileContainer(){	
	var div=document.createElement('div')
	div.innerHTML=filename
	div.classList.add('file-container')
	
	var input=document.createElement('input')
	input.type='file'
	div.append(input)
	
	var btn=document.createElement('button')
	btn.innerHTML='上传'
	btn.targetfiles=input.files
	btn.addEventListener('click', submit)
	div.append(btn)
	return div
}

getList().then(list=>{
	for(let fname of list){
		container.append(fileContainer(name))
	}
})

})