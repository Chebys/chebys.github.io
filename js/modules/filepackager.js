const VER = '0.1'

function pack(files){ //files为可迭代对象（不能是一次性的），迭代File对象，文件名可带有路径
    let meta = {
		version: VER,
        names: [],
        sizes: []
    }
    for(let f of files){
        meta.names.push(f.name)
        meta.sizes.push(f.size)
    }
    return concat(meta, new Blob(files))
}
function packMap(map){ //map为文件名到blob的映射
	return pack(Object.entries(map).map(([name, blob])=>new File([blob], name)))
}
async function unpack(packed) { //返回文件名到blob的映射
    let {meta:{version, names, sizes}, blob} = await divide(packed)
	if(version !== VER) throw '版本不匹配！'
    if(sizes.reduce((s,x)=>s+x) != blob.size) throw '大小不匹配！'
    let output = Object.create(null)
    let start=0
    for(let [i, name] of names.entries()){
        let end = start+sizes[i]
        if(name in output) console.warn('重复的文件：'+name)
        output[name] = blob.slice(start, end)
        start=end
    }
    return output
}

function concat(meta, blob){ //meta为可JSON序列化的对象
    let str=JSON.stringify(meta)
    return new Blob([str, '\0', blob])
}
async function divide(blob){
    let bfr=await blob.arrayBuffer()
    let pos=new Uint8Array(bfr).indexOf(0)
    if(pos<0) throw "no '\\0' found"
    let str=await blob.slice(0, pos).text()
    return {
        meta: JSON.parse(str),
        blob: blob.slice(pos+1)
    }
}

export {pack, packMap, unpack, concat, divide}