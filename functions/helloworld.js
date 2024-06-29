export function onRequest(context) {
	//return context.env.ASSETS.fetch('/The Corruption/')
	return new Response("Hello, world!")
}