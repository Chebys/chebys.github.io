function XHRPromise(url, opts={}){
	//XHRPromise(url, {onProgress}).then(onload)
	var {method, body, onProgress, onUploadProgress, signal} = opts;
	var xhr = new XMLHttpRequest;
	xhr.open(method||'GET', url);
	xhr.responseType = 'blob'; //应该不会丢数据
	xhr.onprogress = onProgress;
	xhr.upload.onprogress = onUploadProgress;
	signal?.addEventListener('abort', ()=>xhr.abort());
	return new Promise((resolve, reject)=>{
		xhr.send(body); //可能需要转换
		//这里尽量和fetch规范一致：fetch() 的 promise 不会因为服务器响应表示错误的 HTTP 状态码而被拒绝
		xhr.onload = ()=>resolve(new Response(xhr.response));
		xhr.onabort = ()=>reject(new DOMException(signal.reason||'no reason', 'AbortError'));
	});
}

function downloadBlob(b, name='未命名'){ //name不能含路径
	var a=document.createElement('a');
	a.style.display='none';
	a.download=name;
	a.href=URL.createObjectURL(b);
	a.click();
}

function downloadFile(f){
	downloadBlob(f, f.name);
}


function downloadUrl(url, fname){
	if(fname==undefined){
		fname=url.slice(url.lastIndexOf('/')+1);
		let i=fname.indexOf('?');
		if(i>=0)fname=fname.slice(0,i);
	}
	function onProgress(e){
		var per=(e.loaded/e.total*100).toFixed(2);
		console.log(fname+':'+per+'%')
	}
	return XHRPromise(url, {onProgress})
		.then(res=>res.blob())
		.then(b=>downloadBlob(new Blob([b]), fname));
}

export {XHRPromise, downloadBlob, downloadFile, downloadUrl};