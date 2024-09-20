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
	console.log(res)
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
async function delFile(name){
	var res=await KV({mode:'delete', filename:name})
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

//下面3个用作按钮监听
function download(){ 
	var fname=this.filename
	getFile(fname).then(dataurl=>downloadWithDataUrl(dataurl, fname))
}
function deletefile(){
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
	statu.innerHTML='加载完成'
}
function refreshList(){
	statu.innerHTML='正在加载'
	return getList().then(refresh)
}

refreshList()
container.append(newFileContainer())

})