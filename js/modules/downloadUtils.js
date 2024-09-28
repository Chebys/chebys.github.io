function XHRPromise(url, opts={}){
	//XHRPromise(url, {onprogress:fn}).then(onload)
	var {method, body, onprogress} = opts;
	var xhr=new XMLHttpRequest;
	xhr.open(method||'GET', url);
	xhr.responseType='blob'; //应该不会丢数据
	xhr.onprogress=onprogress;
	return new Promise((resolve, reject)=>{
		xhr.send(body); //可能需要转换
		xhr.onload=()=>{
			if(xhr.status!=200)reject('http error: '+xhr.status+' at '+url);
			var res=new Response(xhr.response);
			resolve(res);
		};
	});
}

function downloadBlob(b, name='未命名'){
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
	function onprogress(e){
		var per=(e.loaded/e.total*100).toFixed(2);
		console.log(fname+':'+per+'%')
	}
	return XHRPromise(url, {onprogress})
		.then(res=>res.blob())
		.then(b=>downloadBlob(new Blob([b]), fname));
}

export {XHRPromise, downloadBlob, downloadFile, downloadUrl};