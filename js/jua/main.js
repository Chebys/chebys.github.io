const presets_url = '/data/jua/'
const jua_suffix = '.txt'
const info_url = '/data/jua/info.txt'
const ace_url = '/js/ace/ace.js'

const inputbox = document.getElementById('inputbox');
let editor = {
	getValue(){
		return inputbox.value;
	},
	setValue(v){
		inputbox.value = v;
	},
	setReadOnly(v=true){
		inputbox.disabled = v;
	}
};
const _editor = editor;

function disableInput(msg=''){
	editor.setReadOnly();
	editor.setValue(msg);
}
function enableInput(value=''){
	editor.setValue(value, 1);
	editor.setReadOnly(false);
}

function loadScript(src){
	let el = document.createElement('script');
	el.src = src;
	document.head.append(el);
	return new Promise(resolve=>{
		el.onload = resolve;
	});
}

import('jua').then(onLoad, enableInput)

function onLoad(Jua){

const {JuaProcess, JSToJua} = Jua;

const strict_parse_box = document.querySelector('[name=strict-parse][type=checkbox]') || {}
const debug_box = document.querySelector('[name=debug][type=checkbox]') || {}
const highlight_box = document.querySelector('[name=syntax-highlight][type=checkbox]') || {}
//严格解析模式，参见 问题.txt
//该模式下，display 可以正常输出，控制台输出非ascii字符则乱码
globalThis.STRICT_PARSE = strict_parse_box.checked
globalThis.JUA_DEBUG = debug_box.checked

strict_parse_box.onchange = ()=>{ STRICT_PARSE = strict_parse_box.checked }
debug_box.onchange = ()=>{ JUA_DEBUG = debug_box.checked }

let _value = ''
highlight_box.onchange = ()=>{
	_value = editor.getValue()
	if(highlight_box.checked){
		if(globalThis.ace){
			enable_highlight();
		}else{
			disableInput('请稍后')
			loadScript(ace_url).then(enableInput).then(enable_highlight)
		}
	}else{
		disable_highlight()
	}
}
const ctn = document.getElementById('inputbox-ctn')
function enable_highlight(){
	ctn.innerHTML = ''
	editor = ace.edit(ctn, {
		mode: "ace/mode/jua",
		selectionStyle: "text"
	})
	editor.setOptions({
		copyWithEmptySelection: true,
		fontSize: '15px'
	})
	editor.setValue(_value, 1)
}
function disable_highlight(){
	editor.destroy()
	editor = _editor
	ctn.replaceChildren(inputbox)
	editor.setValue(_value)
}

//ascii字符保持不变
function encodeU8(str){
	let encoder = new TextEncoder
	let bytes = encoder.encode(str) 
	return String.fromCharCode(...bytes)
}
function decodeU8(str){
	let len = str.length
	let bytes = new Uint8Array(len)
	for(let i=0; i<len; i++)
		bytes[i] = str.charCodeAt(i)
	let decoder = new TextDecoder
	return decoder.decode(bytes)
}

class JuaVM extends JuaProcess{
	constructor(){
		super('main')
	}
	makeGlobal(env){
		super.makeGlobal(env);
		let apiname = 'Jua Runtime 0.1'
		let api = JSToJua({
			name: apiname,
			alert: val=>alert(val.toString())
		})
		api.proto = JSToJua({
			toString: ()=>apiname
		})
		env.setProp('Runtime', api)
	}
	findModule(name){
		if(name=='main'){
			let value = editor.getValue()
			return STRICT_PARSE ? encodeU8(value) : value
		}
		throw 'module not found'
	}
	stdout(args){
		//console.log('print', ...args)
		display(stdout, ...args)
	}
	stderr(err){
		console.error(err)
		globalThis.$error = err
		display(stderr, err.toDebugString())
	}
}
function display(displayer, ...args){
	//console.log(args)
	let str = args.join('\t')
	if(STRICT_PARSE)
		str = decodeU8(str)
	displayer.textContent += str+'\n';
}
function run(){
	stdout.innerHTML = ''
	stderr.innerHTML = ''
	let vm = new JuaVM
	try{
		vm.run()
	}catch(e){ //处理非jua错误
		stderr.textContent = 'A host error occured. Check console for more infomation.'
		throw e;
	}
}

async function loadPreset(name){
	let url = presets_url+name+jua_suffix
	disableInput('正在加载……')
	let res = await fetch(url)
	enableInput(res.ok ? await res.text() : `代码加载失败：${res.status} ${res.statusText}`)
}
const info = document.getElementById('info')
if(info)info.onclick = () => fetch(info_url)
	.then(r=>r.text())
	.then(alert);
runbtn.onclick = run;
presets.onchange = ()=>{
	let value = presets.value
	if(value)loadPreset(value)
}
enableInput();

}