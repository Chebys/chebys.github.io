import IDBStorage from 'https://js.x-ze.cn/idb-storage'

const ORIGIN = 'https://spa.x-ze.cn'
const TTL = 1000*3600*24 //1 天
const store = new IDBStorage('SPA-frame', 'meta')
const htmlHeaders = { 'Content-Type': 'text/html; charset=utf-8' }

async function refreshCache(){
	let res = await fetch(ORIGIN)
	if(!res.ok)return
	let html = await res.text()
	await store.set('src-cache', {
		date: Date.now(),
		html
	})
	return html
}
async function cacheFirst(){
	let {date, html} = await store.get('src-cache') || {}
	if(html){ //有缓存
		if(Date.now()-date > TTL && navigator.onLine)
			html = await refreshCache()
	}else if(navigator.onLine){ //无缓存，联网
		html = await refreshCache()
	}else{ //无缓存，未联网
		html = '<h1>请连接网络</h1>'
	}
	return new Response(html, {headers: htmlHeaders})
}

self.addEventListener('install', ev => ev.waitUntil(refreshCache()))

self.addEventListener('fetch', ev => {
  const url = new URL(ev.request.url);
  if(url.origin != ORIGIN)
	  return
  
  if (url.pathname == '/' || url.pathname.startsWith('/app/')) {
    ev.respondWith(cacheFirst().catch(()=>fetch(ev.request)))
  }
})