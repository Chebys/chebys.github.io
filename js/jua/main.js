import {JuaProcess, JSToJua} from 'jua';

const presets_url = '/data/jua/'
const jua_suffix = '.txt'
const info_url = '/data/jua/info.txt'

const strict_parse_box = document.querySelector('[name=strict-parse][type=checkbox]')
const debug_box = document.querySelector('[name=debug][type=checkbox]')
//严格解析模式，参见 问题.txt
//该模式下，display 可以正常输出，控制台输出非ascii字符则乱码
globalThis.STRICT_PARSE = strict_parse_box.checked
globalThis.JUA_DEBUG = debug_box.checked

strict_parse_box.onchange = ()=>{ STRICT_PARSE = strict_parse_box.checked }
debug_box.onchange = ()=>{ JUA_DEBUG = debug_box.checked }

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
			return STRICT_PARSE ? encodeU8(ipt.value) : ipt.value
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
	ipt.value = '正在加载……'
	ipt.disabled = true
	let res = await fetch(url)
	ipt.disabled = false
	if(res.ok){
		ipt.value = await res.text()
	}else{
		ipt.value = '代码加载失败：'+res.status+' '+res.statusText
	}
}
info.onclick = () => fetch(info_url)
	.then(r=>r.text())
	.then(alert);
runbtn.onclick = run;
presets.onchange = ()=>{
	let value = presets.value
	if(value)loadPreset(value)
}