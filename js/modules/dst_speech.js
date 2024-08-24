const M={};

var head
const title_zh={//有用吗？
	speech_character:'角色',
	speech_code:'代码',
	strings_code:'代码',
	strings_en:'台词原文',
	strings_cn:'台词中译'
}
var PO;
M.init = (t, v='dst')=>{
	if(typeof t!='string')return;
	PO=t.replace(/\r/g,'');
	if(v.toLowerCase()=='ds')M.switchDS();
	else M.switchDST();
	return true;
}
Object.defineProperty(M, "PO", {get:()=>PO});

//单机版没有 strings_code
const norm=t=>t.trim().replace(/\\n/g,'').replace(/\\\"/g,'"');
var toDataLine
M.switchDST=()=>{
	head='speech_character@speech_code@strings_code@strings_en@strings_cn'.split('@');
	toDataLine=res=>[c,res[1],res[2],norm(res[3]),norm(res[4])]
}
M.switchDS=()=>{
	head='speech_character@speech_code@strings_en@strings_cn'.split('@');
	toDataLine=res=>[c,res[1],norm(res[3]),norm(res[4])]
}

M.getData = c=>{//c为小写角色代码，默认威尔逊
	var p=/#\. STRINGS\.CHARACTERS\.GENERIC\.([\S\s]*?)\nmsgctxt "([\S\s]*?)"\nmsgid "([\S\s]*?)"\nmsgstr "([\S\s]*?)"\n/.source;
	if(c&&c!='wilson')p=p.replace(/GENERIC/g,c);
	else c='wilson';
	p=new RegExp(p,'ig');
	var res=p.exec(PO),data=[];
	while(res){
		data.push(toDataLine(res));
		res=p.exec(PO);
	}
	return data;
}
M.toTabx = data=>{
	var obj={schema:{}};
	obj.schema.fields=head.map(s=>({name:s, type:'string', title:{en:s,zh:''}}));
	obj.data=data;
	return JSON.stringify(obj);
}
M.toXlsx = (data,XLSX)=>{
	if(!XLSX){
		if(window.XLSX)XLSX=window.XLSX;
		else throw new Error('缺少XLSX');
	}
	var wb=XLSX.utils.book_new(), fields=[['name','type','title_zh','title_en']];
	data.unshift(head);
	data=XLSX.utils.aoa_to_sheet(data);
	XLSX.utils.book_append_sheet(wb, data, 'data');
	head.forEach(s=>fields.push([s,'string','',s]));
	fields=XLSX.utils.aoa_to_sheet(fields);
	XLSX.utils.book_append_sheet(wb, fields, 'fields');
	return wb;
}
M.getTabx = c=>M.toTabx(M.getData(c));

export default M;