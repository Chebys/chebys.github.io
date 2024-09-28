function offscreenFileInput(accept){
	var input=document.createElement('input');
	input.type='file';
	input.accept=accept;
	return new Promise(resolve=>{
		input.click();
		input.addEventListener('change', ()=>resolve(input.files[0]));
	})
}
export default offscreenFileInput;