export default class Overwrite {
	init(){
		Token.prototype.previousLocation = [];
		Token.prototype.remainingSpeed = 0;
		let oldPOClone = PlaceableObject.prototype.clone;
		let oldTokenDraw = Token.prototype.draw;
		let oldTokenRefresh = Token.prototype.refresh;

		Object.defineProperty(Token.prototype,'maxSpeed',  {
		    get() {
		       return parseFloat(this.actor.data.data.attributes.speed.value);
			}}
		);


		/// METHODS
		Token.prototype.draw = async function(){
			
			await oldTokenDraw.apply(this);
			this.speedUI = this.addChild(new PIXI.Container());
			this._drawSpeedUI();
			return this;
		}
		Token.prototype.refresh = function(){
			console.log('myRefresh')
			oldTokenRefresh.apply(this);
			this._drawSpeedUI();
		}
		Token.prototype._clearSpeedUI = function(){
			try{this.speedUI.removeChildren()}catch(e){}
		}
		Token.prototype._drawSpeedUI = function(){
			try{this.speedUI.removeChildren()}catch(e){}
			 // Gate font size based on grid size
			const speed = this.remainingSpeed;
		    const gs = canvas.dimensions.size;
		    let h = 24;
		    if ( gs >= 200 ) h = 36;
		    else if ( gs <= 70 ) h = 20;

		    // Create the nameplate text
		    //const name = new PIXI.Text(this.maxSpeed, CONFIG.canvasTextStyle.clone());
		   
		    const name = new PIXI.Text(speed, {
			    fontFamily: "Signika",
			    fontSize: 28,
			    fill: "#FFFFFF",
			    stroke: '#111111',
			    strokeThickness: 1,
			    dropShadow: true,
			    dropShadowColor: "#000000",
			    dropShadowBlur: 4,
			    dropShadowAngle: 0,
			    dropShadowDistance: 0,
			    align: "center",
			    wordWrap: false
		  	});
		    const textHeight = 36; // This is a magic number which PIXI renders at font size 36

		    // Anchor to the top-center of the nameplate
		    name.anchor.set(1, 0);

		    // Adjust dimensions
		    let bounds = name.getBounds();
		    let ratio = bounds.width / bounds.height;
		    const maxWidth = this.w * 2.5;

		    // Wrap for multiple rows
		    if ( (h * ratio) > maxWidth ) {
		      name.style.wordWrap = true;
		      name.style.wordWrapWidth = (textHeight / h) * maxWidth;
		      bounds = name.getBounds();
		      ratio = bounds.width / bounds.height;
		    }

		    // Downsize the name using the given scaling ratio
		    const nrows = Math.ceil(bounds.height / textHeight);
		    name.height = h * nrows;
		    name.width = h * nrows * ratio;

		    // Set position at bottom of token
		    let ox = gs / 24;
		    name.position.set(this.w, 0 - 25);
		   

		    let sprite = PIXI.Sprite.from('./modules/EnhancedMovement/assets/walking-solid.svg');
		    // Anchor to the top-center of the nameplate
		    sprite.anchor.set(1, 0);

		    // Adjust dimensions
		    bounds = sprite.getBounds();
		    ratio = bounds.width / bounds.height;
		    

		   

		    // Downsize the name using the given scaling ratio
		    //const nrows = Math.ceil(bounds.height / textHeight);
		    sprite.height = name.height-7;
		    sprite.width = sprite.height * ratio;
		   
		    // Set position at bottom of token
		    ox = gs / 24;
		    sprite.position.set(this.w-20, 0 - 22);
		    

		    const bg = new PIXI.Graphics();
		   
		    bg.lineStyle(1, 0x333333, 1);
			bg.beginFill(0x555555, 0.9);
			bg.drawRoundedRect(this.w-42,0 -sprite.height-11 , 45, sprite.height +5 , 5);
			bg.endFill();
			console.log(this.speedUI)
			if(typeof this.speedUI != 'undefined'){
				this.speedUI = this.addChild(new PIXI.Container());
			    this.speedUI.addChild(bg);
			    this.speedUI.addChild(sprite);
			    this.speedUI.addChild(name)
			}
		  // return name;
		}
		PlaceableObject.prototype.clone = function(){

			let clone = oldPOClone.apply(this);
			clone.remainingSpeed = this.remainingSpeed;
			return clone;
		}

	}
}

