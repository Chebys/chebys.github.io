function addChild(el, tag){
	let child = document.createElement(tag)
	el.append(child)
	return child
}
function css(el, rules){
	Object.assign(el.style, rules)
}

function Popup({height='400px', width='min(500px, 100%)', title='', text='', content}){
	let bg = addChild(document.body, 'div')
	bg.className = 'popup-container'
	css(bg, {
		position: 'fixed',
		zIndex: 1,
		top: 0,
		left: 0,
		height: '100vh',
		width: '100vw',
		background: 'rgba(0,0,0,.2)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	})
	
	let win = addChild(bg, 'div')
	win.className = 'popup'
	css(win, {
		height,
		width,
		background: 'white',
		borderRadius: '10px',
		display: 'flex',
		flexDirection: 'column',
		padding: '0 10px',
	})
	win.addEventListener('click', e=>e.stopPropagation())
	
	win.titleBar = addChild(win, 'div')
	win.titleBar.innerHTML = title
	
	if(content){
		win.append(content)
		win.content = content
	}else{
		win.content = addChild(win, 'div')
		win.content.innerHTML = text
	}
	css(win.content, {
		flex: 1,
		overflowY: 'auto'
	})
	
	win.btnBar = addChild(win, 'div')
	
	win.confirmBtn = addChild(win.btnBar, 'button')
	win.confirmBtn.innerHTML = '确定'
	
	win.cancelBtn = addChild(win.btnBar, 'button')
	win.cancelBtn.innerHTML = '取消'
	
	win.close = ()=>bg.remove()
	win.confirm = awaitConfirm
	bg.addEventListener('click', win.close)
	win.confirmBtn.addEventListener('click', win.close)
	win.cancelBtn.addEventListener('click', win.close)
	
	return win
}

function awaitConfirm(){
	return new Promise(resolve=>{
		this.confirmBtn.addEventListener('click', ()=>resolve(true))
		this.cancelBtn.addEventListener('click', ()=>resolve(false))
	})
}

export default Popup