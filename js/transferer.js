import {XHRPromise} from '/js/modules/downloadUtils.js'
import FileInput from '/js/modules/offscreen-file-input.js'

const KV_URL = 'https://chebys.pages.dev/kv_transferer'
function KV({mode, filename, body, onProgress, onUploadProgress}){
	var furl=KV_URL+'?', method='POST'
	if(mode)furl += '&mode='+mode
	if(filename)furl += '&filename='+encodeURIComponent(filename)
	//return fetch(furl, {method, body})
	return XHRPromise(furl, {method, body, onProgress, onUploadProgress})
		.then(r=>r.text())
}
function onProgress({loaded, total}){
	//console.log('progress:', loaded, '/', total) total总是0？
	setProgress(loaded, total)
}
async function getList(){
	var res=await KV({mode:'getlist'})
	res=JSON.parse(res) //形如{"list_complete":true,"keys":[{"name":"123"},{"name":"456"}],"cacheStatus":null}
	//console.log(res)
	return res.keys.map(k=>k.name)
}
function getFile(name){
	return KV({filename:name, onProgress})
}
function setFile(name, str){
	return KV({mode:'set', filename:name, body:str, onUploadProgress:onProgress})
}
function delFile(name){
	return KV({mode:'delete', filename:name, onProgress})
}
function encode(file){
	const reader = new FileReader
	return new Promise(resolve=>{
		reader.addEventListener('load', ()=>resolve(reader.result))
		reader.readAsDataURL(file)
	})
}

const Status = {
	getting_list: '正在加载列表',
	downloading: '正在下载',
	deleting: '正在删除',
	uploading: '正在上传',
	done: '完成'
}
var status = null
function setStatus(code, desc){
	status=Status[code]
	if(!status)throw {status, code, desc}
	status_sign.innerHTML=status
	if(desc)status_sign.innerHTML+=': '+desc
	if(code=='done')setProgress()
}
function setProgress(loaded, total){
	if(typeof loaded != 'number'){
		progress_sign.innerHTML='无'
		return
	}
	progress_sign.innerHTML=loaded
	if(total)progress_sign.innerHTML += ' / '+total
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
	setStatus('downloading', fname)
	getFile(fname)
		.then(dataurl=>downloadWithDataUrl(dataurl, fname))
		.then(setStatus)
}
function deletefile(){
	setStatus('deleting', this.filename)
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
	setStatus('uploading')
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
function newFileContainer(){ //暂弃
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
	setStatus('done')
}
function refreshList(){
	setStatus('getting_list')
	return getList().then(refresh)
}

refreshList()
//container.append(newFileContainer())

document.getElementById('upload').addEventListener('click', async ()=>{
	let file = await FileInput()
	let dataurl = await encode(file)
	if(dataurl.length > 1024**2 * 20){
		alert('文件不能超过20Mb')
		return
	}
	setStatus('uploading')
	await setFile(file.name, dataurl)
	refreshList()
})