import data from '/js/modules/test.js'

export async function onRequest(context){
	return new Response(data)
}