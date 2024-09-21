addEventListener('load',  _=>{

const url='/kv_transferer'
function KV({mode, filename, body, onprogress}){
	var furl=url+'?', method='POST'
	if(mode)furl += '&mode='+mode
	if(filename)furl += '&filename='+encodeURIComponent(filename)
	//return fetch(furl, {method, body})
	const xhr=new XMLHttpRequest
	xhr.open(method, furl)
	xhr.onprogress=onprogress
	return new Promise((resolve, reject)=>{
		xhr.onload=function(){
			if(xhr.status==200)resolve(this.responseText)
			else reject(this.response)
		}
		xhr.send(body)
	})
}
function onprogress({loaded, total}){
	console.log('progress:', loaded, '/', total)
}
async function getList(){
	var res=await KV({mode:'getlist'})
	res=JSON.parse(res) //形如{"list_complete":true,"keys":[{"name":"123"},{"name":"456"}],"cacheStatus":null}
	//console.log(res)
	return res.keys.map(k=>k.name)
}
function getFile(name){
	return KV({filename:name, onprogress})
}
function setFile(name, str){
	return KV({mode:'set', filename:name, body:str, onprogress})
}
function delFile(name){
	return KV({mode:'delete', filename:name, onprogress})
}
function encode(file){
	const reader = new FileReader
	return new Promise(resolve=>{
		reader.addEventListener('load', ()=>resolve(reader.result))
		reader.readAsDataURL(file)
	})
}

const Status={
	getting_list: '正在加载列表',
	downloading: '正在下载',
	deleting: '正在删除',
	uploading: '正在上传',
	done: '完成'
}
var statu=null
function setStatu(code, desc){
	statu=Status[code]
	if(!statu)throw {statu, code, desc}
	statu_sign.innerHTML=statu
	if(desc)statu_sign.innerHTML+=': '+desc
}

function downloadWithDataUrl(url, fname='未知'){
	var a=document.createElement('a')
	a.download=fname
	a.href=url
	a.click()
	a.remove()
	return 'done'
}

//下面3个用作按钮监听
function download(){ 
	var fname=this.filename
	setStatu('downloading', fname)
	getFile(fname)
		.then(dataurl=>downloadWithDataUrl(dataurl, fname))
		.then(setStatu)
}
function deletefile(){
	setStatu('deleting', this.filename)
	delFile(this.filename)
		.then(console.log)
		.then(refreshList)
}
function submit(){
	var file = this.getFile()
	if(file.size > 1024**2 * 20){
		alert('文件不能超过20Mb')
		return
	}
	setStatu('uploading')
	encode(file)
		.then(dataurl=>setFile(file.name, dataurl))
		.then(console.log)
		.then(refreshList)
}

function fileContainer(filename){
	var div=document.createElement('div')
	div.innerHTML=filename
	div.classList.add('file-container')
	
	var dlbtn=document.createElement('button')
	dlbtn.innerHTML='下载'
	dlbtn.filename=filename
	dlbtn.addEventListener('click', download)
	div.append(dlbtn)
	
	var delbtn=document.createElement('button')
	delbtn.innerHTML='删除'
	delbtn.filename=filename
	delbtn.addEventListener('click', deletefile)
	div.append(delbtn)
	return div
}
function newFileContainer(){	
	var div=document.createElement('div')
	div.innerHTML='+'
	div.classList.add('file-container')
	
	var input=document.createElement('input')
	input.type='file'
	div.append(input)
	
	var btn=document.createElement('button')
	btn.innerHTML='上传'
	btn.getFile = ()=>input.files[0]
	btn.addEventListener('click', submit)
	div.append(btn)
	return div
}

function refresh(list){
	filelist.replaceChildren()
	for(let fname of list){
		filelist.append(fileContainer(fname))
	}
	setStatu('done')
}
function refreshList(){
	setStatu('getting_list')
	return getList().then(refresh)
}

refreshList()
container.append(newFileContainer())

})