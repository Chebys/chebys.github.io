import {createStore, set as idb_set, del as idb_del, entries, setMany} from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm';
//import LSProxy from '/js/modules/localStorageProxy.js';
import FileInput from '/js/modules/offscreen-file-input.js';
import {downloadBlob} from '/js/modules/downloadUtils.js';
import {packMap, unpack} from '/js/modules/filepackager.js';
import '/js/modules/radio-set.js';

//todo: 数据管理，作者链接，全名搜索完善
//id(get), n, a 头像格式(不含'.'), b 别名, t tag, nonh(get), s_porn, s_skill, s_style 评分, pus, dld, ps 备注
//假值默认显示为空字符串。例外：评分

const key = 'authorInfo',
	GEBI = id=>document.getElementById(id),
	CE = t=>document.createElement(t),
	opt = GEBI('opt'),
	IDB = { //图片数据库
		images: Object.create(null),
		urls: Object.create(null),
		store: createStore('pid', 'pavatar'),
		async loadAll(){
			for(let [name, file] of await entries(this.store)){
				this.images[name] = file;
			}
		},
		get(name){ //返回ObjectURL或假值
			var img = this.images[name];
			if(!img)return;
			if(!this.urls[name])this.urls[name] = URL.createObjectURL(img);
			return this.urls[name];
		},
		async set(name, file){
			if(name in this.images)throw '文件名冲突';
			this.images[name] = file;
			return idb_set(name, file, this.store)
		},
		async del(name){
			return idb_del(name, this.store);
		},
		import(blob){
			unpack(blob)
				.then(map=>setMany(Object.entries(map), this.store))
				.then(()=>alert('导入完成，请刷新页面'), alert)
		},
		export(){
			return packMap(this.images);
		}
	},
	panel = (()=>{
		function getNum(id){
			var v=GEBI(id).value;
			return v&&parseInt(v); //区分'0'和''
		}
		return{
			set n(n){GEBI('cn').value=n||'';},
			get n(){return GEBI('cn').value;},
			set b(b){GEBI('cb').value=b||'';},
			get b(){return GEBI('cb').value;},
			set t(t){GEBI('ct').value=t||'';},
			get t(){return GEBI('ct').value;},
			set s_porn(s){GEBI('s_porn').value=s??'';},
			get s_porn(){return getNum('s_porn')},
			set s_skill(s){GEBI('s_skill').value=s??'';},
			get s_skill(){return getNum('s_skill')},
			set s_style(s){GEBI('s_style').value=s??'';},
			get s_style(){return getNum('s_style')},
			set ps(ps){GEBI('ps').value=ps||'';},
			get ps(){return GEBI('ps').value;},
			set pus(pus){GEBI('pus').checked=Boolean(pus);},
			get pus(){return GEBI('pus').checked},
			set dld(dld){GEBI('dld').checked=Boolean(dld);},
			get dld(){return GEBI('dld').checked}
		};
	})();

class Aut{
	static idKey = Symbol('id');
	static fromObj(obj, id){
		var aut=new this(parseInt(id));
		Object.assign(aut, obj);
		return aut;
	}
	constructor(pid, name, tag){
		this[Aut.idKey]=pid;
		if(name)this.n=name;
		if(tag)this.t=tag;
	}
	get id(){return this[Aut.idKey];}//下策，只是不希望JSON解析id属性
	get nonh(){return this.s_porn===0;}
	get imgUrl(){ //css属性
		return `url("${this.a && IDB.get(this.id+'.'+this.a) || '/img/default_avatar.jpg'}")`;
	}
}
const default_aut = new Aut('未选择');

var json, Data, authorInfo, hide=new Set(),
	head, current, tail, //链表；current只应使用sort函数或detl函数改变；current要么合法（在链表中），要么为假
	pre=Symbol('pre'), next=Symbol('next');

function validJson(str){ //若合法则返回解析后的对象；否则返回假值
	try{
		let obj = JSON.parse(str);
		return obj.meta && obj.pixiv && obj;
	}catch(e){
		return false;
	}
}
function initData(override){
	json = override || localStorage.getItem(key);
	Data = validJson(json);
	if(!Data){
		Data = {meta:{}, pixiv:{}};
		setData();
	}
	authorInfo = Data.pixiv;
	for(let i in authorInfo)
		authorInfo[i]=Aut.fromObj(authorInfo[i], i);
	return IDB.loadAll();
}
function setData(reload, fun){ //保存全部信息并执行回调
	json=JSON.stringify(Data);
	localStorage.setItem(key,json);
	if(reload)loada(1);
	if(fun)fun();
	//setTimeout(loada,50);
	//if(fun)setTimeout(fun,100);
}
function need(a){
	if(!a)return false;
	for(let attr of hide.values())if(a[attr])return false;
	return true;
}
function sort(k){ //排序并生成链表
	if(k)sort.key=k;
	else k=sort.key;
	head=0;
	for(let i in authorInfo){
		if(need(authorInfo[i]))push(authorInfo[i]);
	}
	if(!need(current))current=0;//要么合法，要么为假
	//改变显示
	var so=document.querySelector('#tp th .sortorder');
	if(so)so.remove();
	so=CE('div');
	so.className='sortorder';
	if(!sort.asc)so.style.transform='rotate(180deg)';
	document.querySelector(`#tp th[data-key=${k}]`).appendChild(so);
	
	function push(a){
		a[pre]=a[next]=0;
		if(!head){
			head=tail=a;
			return;
		}
		var p=head;
		while(p&&cmp(a,p))p=p[next];
		if(p){//不是最后一个
			var pre_a=p[pre];
			p[pre]=a;
			a[next]=p;
			if(pre_a){//不是第一个
				a[pre]=pre_a;
				pre_a[next]=a;
			}
			else head=a;
		}
		else{//最后一个
			tail[next]=a;
			a[pre]=tail;
			tail=a;
		}
	}
	function cmp(a1,a2){//a1是否在a2之后
		if(empty(a1[k]))return true;
		if(empty(a2[k]))return false;
		return sort.asc?a1[k]>a2[k]:a1[k]<a2[k];
	}
	function empty(v){return typeof v!='number'&&!v;}
}
function loada(resort){ //根据 authorInfo 加载列表
	if(resort)sort();
	opt.innerHTML='';
	for(let a=head;a;a=a[next])opt.appendChild(getr(a));
	detl(current)||doDetl();//显示当前信息或“未选择”
	function getr(a){//根据 authorInfo 生成 tr
		let r=CE('tr'),d=[];
		r.id=a.id;
		r.addEventListener('click', clickTr);
		if(a.nonh)r.classList.add('nonh');
		if(a.pus)r.classList.add('pause');
		if(a.dld)r.classList.add('deleted');
		for(let j=0;j<6;j++)d[j]=CE('td');//pid，头像，昵称，tag，评分，操作
		let lk=CE('a'), avt=CE('div'), star=CE('img'), b=CE('button');
		lk.innerHTML=a.id;
		lk.href='https://www.pixiv.net/users/'+a.id;
		lk.target="_blank";
		d[0].appendChild(lk);
		if(a.a){
			avt.classList.add('avt');
			avt.style.backgroundImage=a.imgUrl;
			d[1].appendChild(avt);
		}
		d[2].className='name';
		if(a.n)d[2].innerHTML=a.n;
		if(a.t)d[3].innerHTML=a.t;
		if(a.s_porn){
			star.src='/icon/star_'+a.s_porn+'.png';
			d[4].appendChild(star);
		}
		b.innerHTML='移除';
		b.addEventListener('click', clickRemoveBt);
		d[5].appendChild(b);
		for(let j=0;j<6;j++)r.appendChild(d[j]);
		r.addEventListener('dblclick', dblclickTr);
		return r;
	}
}
function detl(a){ //为current赋值，不保证a合法
	if(!a)return;
	if(current)GEBI(current.id).classList.remove('ed');
	current=a;
	GEBI(current.id).classList.add('ed');
	locate();
	doDetl(a);
	return true;
}
function doDetl(a=default_aut){ //右侧详细信息
	GEBI('pid').innerHTML=a.id;
	GEBI('avt').style.backgroundImage=a.imgUrl;
	for(let k in panel)panel[k]=a[k];
}
function sav(){
	if(!current)return;
	for(let k in panel)current[k]=panel[k];
	setData(0,function(){//若非按id排序，是否重排？
		loada();
		flt.style.animationName='svd';
		setTimeout(function(){flt.style.animationName='';},1600);
	});
}
function del(i){ //需保证i合法且为数字
	if(i<0)return;//理论上不会出现
	if(!confirm('确定移除？'))return;
	if(current.id==i)current=0;
	delete authorInfo[i];
	setData(1);
}
function locate(){ //这里假设所有行高度相同
	if(!current)return;
	//GEBI(current.id).scrollIntoView({behavior:'smooth'});
	var height=document.querySelector('#tp thead').getBoundingClientRect().height,
		bottom=document.querySelector('#tp tfoot').getBoundingClientRect().y,
		y=GEBI(current.id).getBoundingClientRect().y;
	if(y<height)main.scrollTop+=y-height;
	if(y+height>bottom)main.scrollTop+=y+height-bottom;
}
function hid(attr,b){ //true隐藏，false显示
	if(b)hide.add(attr);
	else hide.delete(attr);
	loada(1);
}
function showjson(i){
	jsont.value=json;
	wctr.style.visibility=i?'visible':'hidden';
}
function search(reverse){
	var ctn=reverse?pre:next, q=search_q.value;
	if(!q)return;
	var result=searchFrom(current ? current[ctn] : reverse?tail:head);
	if(result)detl(result);
	else alert('查找完毕，换个方向试试吧');
	function searchFrom(a){
		if(!a)return 0;
		if(match(a))return a;
		return searchFrom(a[ctn]);
	}
	function match(a){
		for(let k of ['n','b'])
			if(typeof a[k]=='string'&&a[k].indexOf(q)>=0)
				return true;
	}
}

//事件监听器
function clickTr(){
	detl(authorInfo[this.id]);
}
function dblclickTr(){
	this.querySelector('td>a').click();
}
function clickRemoveBt(e){
	e.stopPropagation();
	var tr=this.closest('tr');
	del(parseInt(tr.id));
}

sort.key = 'id';
sort.asc = 1; //升序

initData().then(()=>loada(1));

GEBI('avt').addEventListener('click', ()=>{
	if(!current)return;
	let validsuffixes = ['.jpg', '.png', '.gif'];
	FileInput(validsuffixes.join())
		.then(f=>{
			let suffix=f.name.match(/\.[^.]+$/)?.[0];
			if(!validsuffixes.includes(suffix))throw '无效的格式'; //可能有用户瞎搞
			if(current.a)IDB.del(current.id+'.'+current.a); //无需等待兑现（大概？）
			current.a=suffix.slice(1);
			let fname=current.id+suffix;
			return IDB.set(fname, f);
		}).then(()=>{
			setData();
			doDetl(current);
		}, alert);
})
savbt.addEventListener('click',sav);
dltbt.addEventListener('click',()=>current&&del(current.id));
addbt.addEventListener('click',()=>{
	var [id, n, t] = [GEBI('iid').value, GEBI('in').value, GEBI('it').value];
	[GEBI('iid').value,GEBI('in').value,GEBI('it').value]=['','',''];
	if(!id){alert('请输入pid');return;}
	id=parseInt(id);
	if(id<=0){alert('输入无效');return;}
	if(authorInfo[id])alert('pid已存在');
	else authorInfo[id]=new Aut(id,n,t);
	setData(1,()=>detl(authorInfo[id]));
});
for(let n of ['nonh','pus','dld']){
	let cb=document.getElementsByName('h-'+n);
	for(let i of [0,1])cb[i].addEventListener('click',()=>hid(n,i));
}
for(let th of document.querySelectorAll('#tp th')){
	let k=th.dataset.key;
	if(k)
		th.addEventListener('click',()=>{
			if(k==sort.key)sort.asc=1-sort.asc;
			else sort.key=k,sort.asc=1;
			loada(1);
		});
}

search_q.addEventListener('keydown',e=>e.code=='Enter'&&search(e.ctrlKey)); //ctrl向上查找
search_pre.addEventListener('click',()=>search(1));
search_next.addEventListener('click',()=>search());
loc.addEventListener('click',locate);
sjbt.addEventListener('click',()=>showjson(1));
wctr.addEventListener('click',()=>showjson(0));
x.addEventListener('click',()=>showjson(0));

importbt.addEventListener('click', ()=>{
	FileInput('.json')
		.then(f=>f.text())
		.then(str=>{
			if(!validJson(str))throw '无效的文件！';
			return initData(str);
		}).then(()=>{
			setData(1);
			showjson(1);
		}, alert)
});
exportbt.addEventListener('click', ()=>{
	var file=new Blob([json]);
	downloadBlob(file, 'authorInfo.json');
});

importimgbt.addEventListener('click', ()=>{
	FileInput('.bin').then(blob=>IDB.import(blob));
})
exportimgbt.addEventListener('click', ()=>downloadBlob(IDB.export(), 'pavatar.bin'));

addEventListener('keydown',e=>{
	switch(e.keyCode){
		case 38:
		e.preventDefault();
		current&&detl(current[pre]);
		break;
		case 40:
		e.preventDefault();
		current&&detl(current[next]);
		break;
	}
});
