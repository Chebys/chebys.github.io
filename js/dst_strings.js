var PO,size,date,head='speech_character@speech_code@strings_code@strings_en@strings_cn',xhr=new XMLHttpRequest();
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
req('https://api.github.com/repos/chebys/chebys.github.io/contents/data/chinese_s.po',res=>size=res.size);
req('https://api.github.com/repos/chebys/chebys.github.io/commits?path=data/chinese_s.po',res=>date=res[0].commit.committer.date);
function setPO(t){
	if(typeof t!='string'){
		console.log('非文本');
		return;
	}
	PO=t.replace(/\r/g,'');
	abort();
	s1.innerHTML='已获取✓';
	s1.style.color='#0c0';
}
function getPO(){
	if(size&&date){
		var s='大小：'+Math.round(size/2**20*100)/100+'Mb\n上次更新：'+date+'\n是否下载？';
		if(!confirm(s))return;
	}
	else if(!confirm('无法获取文件信息，是否继续？'))return;
	s1.innerHTML='0%';
	s1.style.color='#000';
	var bt=document.createElement('button');
	bt.innerHTML='取消';
	bt.addEventListener('click',abort);
	s1bt.appendChild(bt);
	
	xhr.open('GET','/data/chinese_s.po');
	xhr.onprogress=e=>{
		let pro=e.loaded||0;
		s1.innerHTML=Math.floor(pro/size*100)+'%';
	}
	xhr.onload=()=>{
		if(xhr.status!=200)return;
		setPO(xhr.responseText)
	}
	xhr.send();
}
function abort(){
	xhr.abort();
	s1.innerHTML='未获取';
	s1bt.innerHTML='';
}
const Char=()=>document.getElementsByName('char')[0].value;
function extract(){
	if(!PO){
		alert('未获取官方文本');
		return;
	}
	var c=Char(),raw=getRaw(c),fm=document.getElementsByName('format')[0].value;
	if(!raw){alert('提取出错');return;}
	if(fm=='tabx'){
		opt.style.display='block';
		opt.value=toTabx(raw);
	}
	else toXlsx(raw);
}
function getRaw(c){//c为小写角色名，默认威尔逊
	var p=/#\. STRINGS\.CHARACTERS\.GENERIC\.([\S\s]*)#\. STRINGS\.CHARACTERS\.GENERIC\.([\S\s]*?)\n([\S\s]*?)\n([\S\s]*?)\n([\S\s]*?)\n/.source;
	if(c&&c!='wilson')p=p.replace(/GENERIC/g,c);
	else c='wilson';
	var res=new RegExp(p,'i').exec(PO);
	if(!res)return;
	res=res[0].replace(/#\. STRINGS\.CHARACTERS\.([\S\s]*?)\.([\S\s]*?)\nmsgctxt "([\S\s]*?)"\nmsgid "([\S\s]*?)"\nmsgstr "([\S\s]*?)"\n/g,c+'@$2@$3@$4@$5');
	res=res.replace(/\\n/g,'').replace(/\\\"/g,'"');
	//console.log(res)
	return res;
}
function toXlsx(t){
	var fields=[['name','type','title_zh','title_en']];
	head.split('@').forEach(s=>{
		fields.push([s,'string','',s]);
	});
	fields=XLSX.utils.aoa_to_sheet(fields);
	t=head+'\n'+t;
	var wb=XLSX.read(t,{type:'string',FS:'@'});
	wb.SheetNames=['data','fields'];
	wb.Sheets.data=wb.Sheets.Sheet1;
	wb.Sheets.fields=fields;
	XLSX.writeFile(wb,Char()+'.xlsx');
	//return t;
}
function toTabx(t){
	var obj={schema:{}},fields=[];
	head.split('@').forEach(s=>{
		fields.push({name:s,type:"string",title:{en:s,zh:''}});
	});
	obj.schema.fields=fields;
	t=t.split('\n');
	for(var i=0;t[i];i++)t[i]=t[i].split('@');
	obj.data=t;
	console.log(obj);
	return JSON.stringify(obj);
}
onload=()=>{
	infile.addEventListener('change',e=>infile.files[0].text().then(setPO));
	remo.addEventListener('click',getPO);
	extrbt.addEventListener('click',extract);
}
