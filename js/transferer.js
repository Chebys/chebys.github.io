addEventListener('load',  _=>{

const url='/kv_transferer';
async function getContent(){
	statu.innerHTML='加载中';
	var res=await fetch(url, {cache:'no-store'});
	wb.value=await res.text();
	statu.innerHTML='完成';
}
async function postContent(){
	statu.innerHTML='提交中';
	var res=await fetch(url+'&mode=set', {method:'POST', body:wb.value});
	//wb.value=await res.text();
	console.log(await res.text());
	statu.innerHTML='完成';
}
getContent();
download.addEventListener('click', getContent);
submit.addEventListener('click', postContent);

})