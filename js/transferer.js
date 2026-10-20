import {XHRPromise, downloadBlob} from '/js/modules/downloadUtils.js'
import FileInput from '/js/modules/offscreen-file-input.js'

const KV_URL = '/kv-transferer'
const MAX_SIZE = 1024**2 * 20

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
							.catch(err => {
								console.error('下载失败', err)
								alert('下载失败：' + (err && err.message || '未知错误'))
								setStatus('done')
							})
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
							.catch(err => {
								console.error('删除失败', err)
								alert('删除失败：' + (err && err.message || '未知错误'))
								setStatus('done')
							})
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

/* ---------------- 上传（按钮与拖放共用） ---------------- */

function uploadFile(file){
	if(!file)return
	if(isOccupied()){
		alert(status)
		return
	}
	if(file.size > MAX_SIZE){
		alert('文件不能超过20Mb')
		return
	}
	setStatus('uploading', file.name)
	setFile(file.name, file)
		.then(refreshList)
		.catch(err => {
			console.error('上传失败', err)
			alert('上传失败：' + (err && err.message || '未知错误'))
			setStatus('done')
		})
}

async function pickAndUpload(){
	if(isOccupied()){
		alert(status)
		return
	}
	let file
	try {
		file = await FileInput()
	} catch (err) {
		console.error('选择文件失败', err)
		return
	}
	uploadFile(file)
}

/* ---------------- 拖放上传 ---------------- */

let dragDepth = 0

function isFileDrag(e){
	const types = e.dataTransfer && e.dataTransfer.types
	if(!types)return false
	for(let i=0; i<types.length; i++)
		if(types[i] == 'Files')return true
	return false
}

window.addEventListener('dragenter', e => {
	if(!isFileDrag(e))return
	e.preventDefault()
	dragDepth++
	document.body.classList.add('is-dragging')
})

window.addEventListener('dragover', e => {
	if(!isFileDrag(e))return
	e.preventDefault()
	if(e.dataTransfer)e.dataTransfer.dropEffect = 'copy'
})

window.addEventListener('dragleave', e => {
	if(!isFileDrag(e))return
	dragDepth = Math.max(0, dragDepth - 1)
	if(dragDepth === 0)document.body.classList.remove('is-dragging')
})

window.addEventListener('drop', e => {
	if(!isFileDrag(e))return
	e.preventDefault()
	dragDepth = 0
	document.body.classList.remove('is-dragging')

	const files = e.dataTransfer.files
	if(!files || !files.length)return
	if(files.length > 1){
		alert('一次只能上传一个文件')
		return
	}
	uploadFile(files[0])
})

/* ---------------- 移动端底部面板 ---------------- */

function initMobilePanel(){
	const panel = document.getElementById('panel')
	const header = document.getElementById('panel-header')
	const toggle = document.getElementById('panel-toggle')
	const summary = document.getElementById('panel-summary')
	const statusSign = document.getElementById('status_sign')
	if(!panel || !header || !toggle)return

	const isMobile = () => window.matchMedia('(max-width: 780px)').matches

	function togglePanel(){
		const expanded = panel.classList.toggle('is-expanded')
		toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false')
	}

	toggle.addEventListener('click', e => {
		e.stopPropagation()
		togglePanel()
	})

	header.addEventListener('click', e => {
		if(!isMobile())return
		if(e.target.closest('.panel-toggle'))return
		togglePanel()
	})

	if(summary && statusSign){
		const sync = () => {
			const t = statusSign.textContent || ''
			const i = t.indexOf(':')
			summary.textContent = i > 0 ? t.slice(0, i) : t
		}
		new MutationObserver(sync).observe(statusSign, {
			childList: true, characterData: true, subtree: true
		})
		sync()
	}
}

/* ---------------- 启动 ---------------- */

initMobilePanel()

refreshList().catch(err => {
	console.error('加载列表失败', err)
	setStatus('done')
})

document.getElementById('upload').addEventListener('click', pickAndUpload)