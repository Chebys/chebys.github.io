//依赖radio-set.css
function parseAllRadioSet(){
	var rs=document.getElementsByClassName('radio-set');
	for(let s of rs)parseRadioSet(s);
}
function parseRadioSet(set){
	let dat=set.dataset, name=dat.name, values=dat.value.split(','), texts=dat.text.split(','), len=values.length;
	if(len!=texts.length){
		console.log('parseRadioSet 参数长度不一致');
		return;
	}
	for(let i=0;i<len;i++){
		let l=document.createElement('label'), r=document.createElement('input');
		r.type='radio';
		r.name=name;
		r.value=values[i];
		r.id=r.name+i;
		l.htmlFor=r.id;
		l.innerHTML=texts[i];
		if(i==0)r.checked=true;
		set.appendChild(r);
		set.appendChild(l);
	}
}
//附赠小工具
function Radio(name){
	var rs=document.querySelectorAll(`input[type=radio][name=${name}]`);
	return {
		get value(){for(let r of rs)if(r.checked==true)return r.value;},
		set value(v){for(let r of rs)if(r.value==v)r.checked=true;},
		set onchange(fn){//有问题，不建议使用
			for(let r of rs)r.addEventListener('change',()=>fn(r.value));
		}
	}
}
export {parseAllRadioSet, parseRadioSet, Radio};
parseAllRadioSet();