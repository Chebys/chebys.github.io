addEventListener('load',  _=>{

const url='/kv_transferer';
function KV({mode, filename, body}){
	var furl=url+'?', method='POST'
	if(mode)furl += '&mode='+mode
	if(filename)furl += '&filename='+encodeURIComponent(filename)
	return fetch(furl, {method, body})
}
async function getList(){
	//形如{"list_complete":true,"keys":[{"name":"123"},{"name":"456"}],"cacheStatus":null}
	var res=await KV({mode:'getlist'})
	res=await res.json()
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

var testname='test.txt'
function download(){
	getFile(testname)
		.then(dataurl=>downloadWithDataUrl(dataurl, testname))
}
function submit(){
	var file = file0.files[0]
	encode(file)
		.then(dataurl=>setFile(testname, dataurl))
		.then(console.log)
}

downloadbtn.addEventListener('click', download);
submitbtn.addEventListener('click', submit);

})