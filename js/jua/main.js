import {JuaProcess} from 'jua';

const default_src = '/data/jua/coding.txt';
const info_url = '/data/jua/info.txt'

const strict_parse_box = document.querySelector('[name=strict-parse][type=checkbox]')
const debug_box = document.querySelector('[name=debug][type=checkbox]')
//严格解析模式，参见 问题.txt
//该模式下，display 可以正常输出，控制台输出非ascii字符则乱码
globalThis.STRICT_PARSE = strict_parse_box.checked
globalThis.DEBUG = debug_box.checked

strict_parse_box.onchange = ()=>{ STRICT_PARSE = strict_parse_box.checked }
debug_box.onchange = ()=>{ DEBUG = debug_box.checked }

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
	makeGlobal(){
		let _G = super.makeGlobal()
		//_G.setProp('test', JSToJua(()=>console.log('ellowood')))
		return _G
	}
	findModule(name){
		if(name=='main'){
			return STRICT_PARSE ? encodeU8(ipt.value) : ipt.value
		}
		throw 'module not found'
	}
	stdout(args){
		console.log('print', ...args)
		display(stdout, ...args)
	}
	stderr(err){
		console.error(err)
		display(stderr, err)
	}
}
function display(displayer, ...args){
	let str = args.join('\t')
	if(STRICT_PARSE)
		str = decodeU8(str)
	displayer.textContent += str+'\n';
}
function run(){
	stdout.innerHTML = ''
	stderr.innerHTML = ''
	let vm = new JuaVM
	vm.run()
}

window.onload = () => fetch(default_src)
	.then(r=>r.text())
	.then(str=>{ ipt.value = str; });
info.onclick = () => fetch(info_url)
	.then(r=>r.text())
	.then(alert);
runbtn.onclick = run;