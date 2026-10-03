import {XHRPromise, downloadBlob} from '/js/modules/downloadUtils.js'
import FileInput from '/js/modules/offscreen-file-input.js'

const KV_URL = '/kv-transferer'
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
	status = Status[code]
	if(!status)throw {status, code, desc}
	status_sign.textContent = status
	if(desc)status_sign.textContent += ': '+desc
	if(code=='done')setProgress()
}
function setProgress(loaded, total){
	if(typeof loaded != 'number'){
		progress_sign.textContent = '无'
		return
	}
	progress_sign.textContent = sizeText(loaded)
	if(total){
		progress_sign.textContent += ' / '+sizeText(total)
		progress_bar.style.width = loaded/total*100 + '%'
	}
}
function isOccupied(){
	return status!=Status.done
}
function sizeText(size){
	let unit = 'KB'
	size /= 1024
	if(size >= 1024){
		unit = 'MB'
		size /= 1024
	}
	return size.toFixed(2) + unit
}

function $n(tag, data={}){
	let el = document.createElement(tag)
	for(let k in data){
		let v = data[k]
		if(k=='content'){
			if(typeof v=='string')
				el.textContent = v
			else if(v instanceof Array)
				el.append(...v)
			else
				throw new TypeError('invalid content', {cause:v})
		}else if(k=='style' && typeof v=='object'){
			Object.assign(el.style, v)
		}else if(k=='data' && typeof v=='object'){
			Object.assign(el.dataset, v)
		}else if(k=='init' && typeof v=='function'){
			v.call(el, data)
		}else{
			el[k] = v
		}
	}
	return el
}
function fileContainer(filename){
	return $n('div', {
		className: 'file-container',
		content: [
			$n('div', { content: [
				$n('div', {
					className: 'file-icon',
					content: '📄'
				}),
				$n('div', {
					className: 'file-name',
					content: filename
				}),
			]}),
			$n('div', { className: 'file-actions', content: [
				$n('button', {
					className: 'btn-download',
					content: '下载',
					onclick(){
						if(isOccupied()){
							alert(status)
							return
						}
						setStatus('downloading', filename)
						getFile(filename)
							.then(blob=>downloadBlob(blob, filename))
							.then(()=>setStatus('done'))
					}
				}),
				$n('button', {
					className: 'btn-delete',
					content: '删除',
					onclick(){
						if(isOccupied()){
							alert(status)
							return
						}
						if(!confirm('确定删除？'))return
						setStatus('deleting', filename)
						delFile(filename)
							.then(console.log)
							.then(refreshList)
					}
				})
			]})
		]
	})
}

function refresh(list){
	filelist.replaceChildren()
	if(!list.length){
		filelist.append($n('div', { className: 'empty-state', content: [
			$n('span', {content: '📁'}),
			$n('h3', {content: '暂无文件'}),
			$n('p', {content: '上传您的第一个文件开始使用文件中转站'})
		]}))
		return
	}
	for(let fname of list){
		filelist.append(fileContainer(fname))
	}
	setStatus('done')
}
function refreshList(){
	setStatus('getting_list')
	return getList().then(refresh)
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

refreshList()

document.getElementById('upload').addEventListener('click', upload)