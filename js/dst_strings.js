onload=()=>{
const POurl='/data/chinese_s.po';
var size,date,xhr=new XMLHttpRequest();
function req(url,load){
	var xh=new XMLHttpRequest();
	xh.open('GET',url);
	xh.onload=()=>{
		if(xh.status!=200)return;
		var res=JSON.parse(xh.responseText);
		//console.log(res)
		load(res);
	}
	xh.send();
}
req('https://api.github.com/repos/chebys/chebys.github.io/commits?path=data/chinese_s.po',res=>date=res[0].commit.committer.date);

function getPO(pre){
	if(!pre){
		if(!size){
			alert('未找到资源');
			return;
		}
		var s='大小：'+Math.round(size/2**20*100)/100+'Mb\n上次更新：'+(date||'未知')+'\n是否下载？';
		if(!confirm(s))return;
		
		s1.innerHTML='0%';
		s1.style.color='#000';
		var bt=document.createElement('button');
		bt.innerHTML='取消';
		bt.addEventListener('click',abort);
		s1bt.appendChild(bt);
	}
	
	xhr.onprogress=pre?e=>{
		size=e.total;
		abort();
	}:e=>{
		let pro=e.loaded||0;
		s1.innerHTML=Math.floor(pro/size*100)+'%';
	}
	xhr.onload=()=>{
		if(xhr.status!=200)return;
		setPO(xhr.responseText);
	}
	xhr.open('GET',POurl);
	xhr.send();
}
function setPO(t){
	if(!dstSpeech.init(t))return;
	abort();
	s1.innerHTML='已获取✓';
	s1.style.color='#0c0';
}
function abort(){
	xhr.abort();
	s1.innerHTML='未获取';
	s1bt.innerHTML='';
}
function extract(){
	if(!dstSpeech.PO){
		alert('未获取官方文本');
		return;
	}
	var c=document.getElementsByName('char')[0].value,
		fm=document.getElementsByName('format')[0].value,
		data=dstSpeech.getData(c);
	if(!data){alert('提取出错');return;}
	if(fm=='tabx'){
		opt.style.display='block';
		opt.value='请稍后';
		setTimeout(()=>{opt.value=dstSpeech.toTabx(data);},0);//防止阻塞
	}
	else{
		var wb=dstSpeech.toXlsx(data);
		XLSX.writeFile(wb,c+'.xlsx');
	}
}

infile.addEventListener('change',e=>infile.files[0].text().then(setPO));
remo.addEventListener('click',e=>getPO(0));
extrbt.addEventListener('click',extract);
getPO(1);
}
