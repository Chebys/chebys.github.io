import IDBStorage from 'https://js.x-ze.cn/idb-storage'

const ORIGIN = 'https://spa.x-ze.cn'
const TTL = 1000*3600*24 //1 天
const store = new IDBStorage('spa-frame', 'meta')

async function refreshCache(){
	let res = await fetch(ORIGIN)
	let html = await res.text()
	await store.set('src-cache', {
		date: Date.now(),
		html
	})
	return html
}
async function cacheFirst(){
	let {date, html} = await store.get('src-cache')
	if(Date.now()-date > TTL)
		html = await refreshCache()
	return new Response(html, { 'Content-Type': 'text/html; charset=utf-8' })
}

self.addEventListener('install', ev => ev.waitUntil(refreshCache()))

self.addEventListener('fetch', ev => {
  const url = new URL(ev.request.url);
  if(url.origin != ORIGIN)
	  return
  
  if (url.pathname == '/' || url.pathname.startsWith('/app/')) {
    ev.respondWith(cacheFirst())
  }
})