var ActionAnimation = cc.Node.extend({
	sprite:null,
    frameX: 0,
    frameY: 0,
    w: 0,
    h: 0,
    row: 0,
    length: 0,
    name : "",
    dir : 0,
    parent: null,
    ctor:function (parent, sprite, row, length, w, h, frameX, frameY, name) {
        //////////////////////////////
        // super init first
        this._super();

        this.sprite = sprite;
        this.row = row;
        this.length = length;
        this.w = w;
        this.h = h;
        this.frameX = frameX;
        this.frameY = frameY;
        this.name = name;
        this.parent = parent;
        return true;
    },	
    
    play : function()
    {
        this.sprite.setTextureRect(cc.rect(this.frameX * this.w, (this.frameY + this.row) * this.h, this.w, this.h));
        this.frameX += 1;
        if(this.frameX >= this.length)
            this.frameX = 0;
    },

    reset : function()
    {
        this.frameX = 0;
        this.frameY = 0;
        this.parent.addChild(this.sprite);
    },
    
    stop : function()
    {
    	this.parent.removeChild(this.sprite);
    }
});


/*
	活动精灵对象类
*/
var ActionSprite = cc.Node.extend({
	sprite:null,
    frameX: 0,
    frameY: 0,
    scene:null,
    animations: null,
    state: 0,
    speed: 6,
    lastAnim: null,
    res: "",
    isMoving: false,
    ctor:function (scene, res) {
        //////////////////////////////
        // super init first
        this._super();
        
        this.scene = scene;
        this.res = res;
		this.animations = {};
        return true;
    },	

    onEnter: function () 
    {
    	this._super();
    	
    	this.setSprite(this.res);
    	
        // 激活update
        this.schedule(this.spriteUpdate, 0.15, cc.REPEAT_FOREVER, 0.15);
    },

    onExit: function () 
    {
    	this._super();
    },

	setSpeed : function(speed)
	{
		this.speed = speed;
	},
		
    setSprite : function(res)
    {
    	this.res = res;
    	if(this.sprite != null)
    	{
    		this.removeChild(this.sprite);
    	}
    	
        spriteRes = res.replace(/\\/g,'/');
        var s1 = spriteRes.lastIndexOf('/');
        var s2 = spriteRes.lastIndexOf('.');
        var name = spriteRes.substring(s1 + 1, s2);

        var jsonData = cc.loader.getRes("res/sprites/" + name + ".json");

		this.sprite = new cc.Sprite(res, cc.rect(0, 0, jsonData.width * 3, jsonData.height * 3));
		
		// 播放动画的时候决定添加到节点上显示
		// 因为可能动画不在同一张图上, 例如死亡动画是一张通用的精灵图
        // this.addChild(this.sprite);

        // 初始化动画信息
        this.animations = {};
        this.lastAnim = null;
        
        var animations = jsonData.animations;
        for(var aniName in animations)
        {
            var ani = animations[aniName];
            var actionAnimation = new ActionAnimation(this, this.sprite, ani.row, ani.length, jsonData.width * 3, jsonData.height * 3, 0, 0, aniName);
            this.animations[aniName] = actionAnimation;
        }
        
        // 如果资源中没有包含死亡动画，那么创建一个通用死亡动画
        var deathAnim = this.animations["death"];
        if(deathAnim == undefined)
        {
        	jsonData = cc.loader.getRes("res/sprites/death.json");
        	var ani = jsonData.animations["death"];
        	var death_sprite = new cc.Sprite("res/img/3/death.png", cc.rect(0, 0, jsonData.width * 3, jsonData.height * 3))
        	this.animations["death"] = new ActionAnimation(this, death_sprite, ani.row, ani.length, jsonData.width * 3, jsonData.height * 3, 0, 0, "death");
        }
        
        // 重新刷动画播放
        this.setState(this.state);
    },

    play : function(aniName)
    {
    	if(arguments.length == 1)
    	{
	        if(this.lastAnim == null || this.lastAnim.name != aniName)
	        {
	        	if(this.lastAnim != null)
	        		this.lastAnim.stop();
	        	
	            this.lastAnim = this.animations[aniName];
	            if(this.lastAnim != undefined)
	          	  this.lastAnim.reset();
	          	else
	          		return;
	        }
	    }
	    else
	    {
	    	if(this.lastAnim == null)
	    		return;
	    }

	    this.lastAnim.play();
    },

    setState : function(state)
    {
        this.state = state;

        if(state == 1)
            this.stop();
        else
          // 初始动作表现
           this.updateAnim();
    },

    calcDirection: function (dx, dy) 
    {
        // 坐标系 →x ↑y， 0 当前方向不变， 1 到 4 分别为右、上、左、下        
        if (dx > 0 && dx >= Math.abs(dy))
        {
            return 1; // 右
        }
        else if (dx < 0 && Math.abs(dx) >= Math.abs(dy))
        {
            return 3; // 左
        }
        else if (dy > 0 && dy >= Math.abs(dx))
        {
            return 2; // 上
        }
        else if (dy < 0 && Math.abs(dy) >= Math.abs(dx))
        {
            return 4; // 下
        }
        
        return 0; // 当前方向不变
    },
    
    getDirection : function()
    {
    	return this.dir;
    },
    	
    setDirection : function(dir)
    {
    	if(dir == 0)
    	{
    		this.updateAnim();
    		return;
    	}
    	
		this.dir = dir;
		this.updateAnim();
    },
    
    updateAnim : function()
    {
    	/* 服务端脚本定义的状态
			ENTITY_STATE_UNKNOW										= -1
			ENTITY_STATE_FREE										= 0
			ENTITY_STATE_DEAD										= 1
			ENTITY_STATE_REST										= 2
			ENTITY_STATE_FIGHT										= 3
			ENTITY_STATE_MAX    									= 4    
			
			当前所有的动作
			atk_right
			walk_right
			idle_right
			atk_up
			walk_up
			idle_up
			atk_down
			walk_down
			idle_down		
    	*/
    	    	
		var anim = "idle_";
		
		if(this.state == 1)
		{
			anim = "death";
		}
		else
		{
			if(this.isMoving)
			{
				anim = "walk_";
			}
			else if(this.state == 3)
			{
				// 这里仍然使用idle， "atk_", 在挥动武器的刹那才播放该动作
				anim = "idle_"; 
			}
			
			switch(this.dir)
			{
				case 1:
					this.scaleX = 1;		
					anim += "right";
					break;
				case 2:
					anim += "up";
					break;
				case 3:
					// 由于只有一个right, 因此这个方向的表现需要翻转图片
					this.scaleX = -1;
					anim += "right";
					break;
				case 4:
					anim += "down";
					break;
			};
		}
		
		this.play(anim);
    },
    
    stop : function()
    {
    	this.stopAllActions();
    	this.isMoving = false;
    	this.updateAnim();
    },
    	
	moveTo : function(position)
	{
		this.stopAllActions();

        var x = position.x - this.x;
        var y = position.y - this.y;
        var t = Math.sqrt(x * x + y * y) / 16 / this.speed;
        
        var act1 = cc.moveTo(t, position);
        var act2 = cc.callFunc(this.onMoveToOver);
        var actF = cc.sequence(act1, act2);
		this.runAction(actF);
		
		this.isMoving = true;
		this.setDirection(this.calcDirection(x, y));
	},

    onMoveToOver : function (pSender) 
    {
        if(pSender.lastAnim == null || pSender.lastAnim.name == "walk_down")
        {
        	pSender.play("idle_down");
        }    	
        else if(pSender.lastAnim.name == "walk_up")
        {
        	pSender.play("idle_up");
        }
        else if(pSender.lastAnim.name == "walk_right")
        {
        	pSender.play("idle_right");
        }
        
        this.isMoving = false;
    },
    	
    /* -----------------------------------------------------------------------/
    							其他系统相关
    /------------------------------------------------------------------------ */
    spriteUpdate : function(dt)
    {
        this.play();
    }
});