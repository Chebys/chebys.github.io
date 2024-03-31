var dstSpeech={};

(function(){

const head='speech_character@speech_code@strings_code@strings_en@strings_cn'.split('@');
var PO;
dstSpeech.init=t=>{
	if(typeof t!='string')return;
	PO=t.replace(/\r/g,'');
	return true;
}
Object.defineProperty(dstSpeech,"PO",{get:()=>PO});
const norm=t=>t.trim().replace(/\\n/g,'').replace(/\\\"/g,'"');
dstSpeech.getData=c=>{//c为小写角色代码，默认威尔逊
	var p=/#\. STRINGS\.CHARACTERS\.GENERIC\.([\S\s]*?)\nmsgctxt "([\S\s]*?)"\nmsgid "([\S\s]*?)"\nmsgstr "([\S\s]*?)"\n/.source;
	if(c&&c!='wilson')p=p.replace(/GENERIC/g,c);
	else c='wilson';
	p=new RegExp(p,'ig');
	var res=p.exec(PO),data=[];
	while(res){
		data.push([c,res[1],res[2],norm(res[3]),norm(res[4])]);
		res=p.exec(PO);
	}
	return data;
}
dstSpeech.toTabx=data=>{
	var obj={schema:{}};
	obj.schema.fields=head.map(s=>({name:s,type:'string',title:{en:s,zh:''}}));
	obj.data=data;
	return JSON.stringify(obj);
}
dstSpeech.toXlsx=(data,XLSX)=>{
	if(!XLSX){
		if(window.XLSX)XLSX=window.XLSX;
		else return false;
	}
	var wb=XLSX.utils.book_new(),fields=[['name','type','title_zh','title_en']];
	data.unshift(head);
	data=XLSX.utils.aoa_to_sheet(data);
	XLSX.utils.book_append_sheet(wb,data,'data');
	head.forEach(s=>fields.push([s,'string','',s]));
	fields=XLSX.utils.aoa_to_sheet(fields);
	XLSX.utils.book_append_sheet(wb,fields,'fields');
	return wb;
}

})();