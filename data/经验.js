languages/chinese_s.po //中文翻译
	STRINGS.CHARACTERS
	STRINGS.NAMES
	STRINGS.RECIPE_DESC
	STRINGS.SCRAPBOOK  //图鉴
	STRINGS.UI
	STRINGS.WET_PREFIX //潮湿前缀


components/ //组件 
	inst:AddComponent()//用于prefabs
	ThePlayer.components.
	self.inst //拥有组件的实例（大概）
components/combat.lua//战斗
components/equippable.lua
	Equippable:GetDapperness //理智影响
components/edible.lua //可食用
	foodtype,secondaryfoodtype
components/moisture.lua//潮湿
components/lootdropper.lua //掉落物
	SetLoot(table) //设置掉落物
	SetLootSetupFn //设置掉落函数
components/locomotor.lua //运动
	walkspeed,runspeed
components/perishable.lua //腐坏
components/worldstate.lua

map/tasks.lua
	AddTask() //生物群系
map/tasks/dst_tasks_forestworld.lua

prefabs/player_common.lua //为ThePlayer赋值
prefabs/hats.lua //所有帽子在一个文件
prefabs/world.lua //为TheWorld赋值


constants.lua //常量
	FOODTYPE,TECH
consolecommands.lua
	ConsoleWorldPosition():Get()
debugcommands.lua
easing.lua//lua库，一些数学函数
	local function inSine(t, b, c, d)
		return c-c*cos(t/d * (pi/2)) + b
	end

mainfunctions.lua
	Start()
	CreateEntity()
	ShowBadHashUI()
main.lua //主函数？global()
modutil.lua //mod相关
	GetModConfigData()//modinfo.lua中的configuration_options
	InsertPostInitFunctions(env, isworldgen, isfrontend) //env的方法可直接在modmain.lua中调用？

preparedfoods.lua
prefablist.lua
prefabs.lua //Prefab = Class( function(self, name, fn, assets, deps, force_path_search)...end)

Recipe.lua//Recipe = Class(function(self, name, ingredients, tab, level, placer_or_more_data, min_spacing, nounlock, numtogive, builder_tag, atlas, image, testfn, product, build_mode, build_distance)
recipes.lua //制作配方
recipes_filter.lua //制作分类

tuning.lua //数值

AddRecipe()

//entity实体
entityscript.lua
TheSim c++层的接口