//依赖radio-set.css
function parseAllRadioSet(){
	var rs=document.getElementsByClassName('radio-set');
	for(let s of rs)parseRadioSet(s);
}
function parseRadioSet(set){
	if(set.parsed)return;
	let {name, value, text} = set.dataset;
	appendChild(set, name, value.split(','), text.split(','));
}
function appendChild(set, name, values, texts){
	let len = values.length;
	if(len != texts.length)
		throw 'RadioSet 参数长度不一致';
	for(let i=0; i<len; i++){
		let l = document.createElement('label'),
			r = document.createElement('input');
		r.type = 'radio';
		r.name = name;
		r.value = values[i];
		r.id = r.name+i;
		l.htmlFor = r.id;
		l.innerHTML = texts[i];
		if(i==0)r.checked = true;
		set.appendChild(r);
		set.appendChild(l);
	}
	set.parsed = true;
}
//附赠小工具
function Radio(name){
	return _radio(document.querySelectorAll(`input[type=radio][name=${name}]`));
}
function makeRadio(el, texts, values, name=crypto.randomUUID()){
	el.className = 'radio-set';
	el.replaceChildren();
	appendChild(el, name, values, texts);
	return _radio(el.children);
}
function _radio(list){
	return {
		get value(){
			for(let r of list)
				if(r.checked==true)
					return r.value;
		},
		set value(v){
			for(let r of list)
				if(r.value==v)
					r.checked=true;
		},
		set onchange(fn){ //有问题，不建议使用
			for(let r of list)
				r.addEventListener('change',()=>fn(r.value));
		}
	}
}

export {parseAllRadioSet, parseRadioSet, Radio, makeRadio};
parseAllRadioSet();