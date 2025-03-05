import {XHRPromise, downloadBlob} from '/js/modules/downloadUtils.js'
import FileInput from '/js/modules/offscreen-file-input.js'

const KV_URL = 'https://chebys.pages.dev/kv_transferer'
function KV({mode, filename, body, onProgress, onUploadProgress}){
	var furl=KV_URL+'?', method='POST'
	if(mode)furl += '&mode='+mode
	if(filename)furl += '&filename='+encodeURIComponent(filename)
	//return fetch(furl, {method, body})
	return XHRPromise(furl, {method, body, onProgress, onUploadProgress})
		.then(r => mode ? r.text() : r.blob())
}
function onProgress({loaded, total}){
	//console.log('progress:', loaded, '/', total) total总是0？
	setProgress(loaded, total)
}
async function getList(){ //服务端有缓存
	var res=await KV({mode:'getlist'})
	res=JSON.parse(res) //形如{"list_complete":true,"keys":[{"name":"123"},{"name":"456"}],"cacheStatus":null}
	//console.log(res)
	return res.keys.map(k=>k.name)
}
function getFile(name){
	return KV({filename:name, onProgress})
}
function setFile(name, blob){
	return KV({mode:'set', filename:name, body:blob, onUploadProgress:onProgress})
}
function delFile(name){
	return KV({mode:'delete', filename:name, onProgress})
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
	status_sign.textContent=status
	if(desc)status_sign.textContent+=': '+desc
	if(code=='done')setProgress()
}
function setProgress(loaded, total){
	if(typeof loaded != 'number'){
		progress_sign.textContent = '无'
		return
	}
	progress_sign.textContent = loaded
	if(total)progress_sign.textContent += ' / '+total
}
function isOccupied(){
	return status!=Status.done
}

//下面3个用作按钮监听
function download(){ 
	if(isOccupied()){
		alert(status)
		return
	}
	var fname=this.filename
	setStatus('downloading', fname)
	getFile(fname)
		.then(blob=>downloadBlob(blob, fname))
		.then(()=>setStatus('done'))
}
function deletefile(){
	if(!confirm('确定删除？'))return
	if(isOccupied()){
		alert(status)
		return
	}
	setStatus('deleting', this.filename)
	delFile(this.filename)
		.then(console.log)
		.then(refreshList)
}
async function upload(){
	if(isOccupied()){
		alert(status)
		return
	}
	let file = await FileInput()
	if(file.size > 1024**2 * 20){
		alert('文件不能超过20Mb')
		return
	}
	setStatus('uploading')
	await setFile(file.name, file)
	refreshList()
}

function fileContainer(filename){
	var div=document.createElement('div')
	div.classList.add('file-container')
	
	var title=document.createElement('div')
	title.textContent=filename
	div.append(title)
	
	var dlbtn=document.createElement('button')
	dlbtn.textContent='下载'
	dlbtn.filename=filename
	dlbtn.addEventListener('click', download)
	div.append(dlbtn)
	
	var delbtn=document.createElement('button')
	delbtn.textContent='删除'
	delbtn.filename=filename
	delbtn.addEventListener('click', deletefile)
	div.append(delbtn)
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

document.getElementById('upload').addEventListener('click', upload)