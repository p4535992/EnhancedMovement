
export default class EnhancedMovement {
	constructor(token){

		this.token = token;
		this.actor = this.token.actor;
		this.totalSpeed = this.token.getFlag('EnhancedMovement','totalSpeed') ?? 0;
		this.isDashing =  this.token.getFlag('EnhancedMovement','isDashing') ?? false;
		this.movementMode = (typeof this.token.getFlag('EnhancedMovement','movementMode') != 'undefined') ? this.token.getFlag('EnhancedMovement','movementMode'):'walk';
		this.nDiagonals = this.token.getFlag('EnhancedMovement','nDiagonal') ?? 0;
		this.ignoreDifficultTerrain = this.token.getFlag('EnhancedMovement','ignoreDifficultTerrain') ?? false;
		this.getMovementTypes();
		this.remainingSpeed =  this.token.getFlag('EnhancedMovement','remainingSpeed') ?? this.maxSpeed;//(this.maxSpeed * ((this.isDashing) ? 2:1)) - this.totalSpeed;
		this.token.setFlag('EnhancedMovement','isUndoing',false);

		this.initialX = token.x;
		this.initialY = token.y;
	}
	get maxSpeed(){
		return this.movementTypes[this.movementMode].maxSpeed;
	}
	getMovementTypes(){
		this.movementTypes = {};
		for(const entry in this.actor.data.data.attributes.movement) {
			if(entry == "units") {

			} else if(entry == "hover") {

			} else {
				this.movementTypes[entry] = {maxSpeed: this.actor.data.data.attributes.movement[entry]};
			}
		}
	}
	async updateMovementSpeedFlag(){
		await this.token.unsetFlag('EnhancedMovement','remainingSpeed').then(()=>{
			this.token.setFlag('EnhancedMovement','remainingSpeed', this.remainingSpeed);
		});
		
	}
	addMovementType(type,speed){
		type = type.toLowerCase();
		speed = parseFloat(speed);
		this.movementTypes[type.toLowerCase()]={
			maxSpeed:speed
		}
		if(canvas.hud.speedHUD.token.id != this.token.id){
			canvas.hud.speedHUD.updateHUD()
		}
		this.token.refresh();
	}
	removeMovementType(type){
		type = type.toLowerCase();
		if(this.movementMode == type)
			this.movementMode = 'walk';
		delete this.movementTypes[type];
	}
	toggleIgnoreTerrain(){
		this.ignoreDifficultTerrain = !this.ignoreDifficultTerrain;
		this.token.setFlag('EnhancedMovement','ignoreDifficultTerrain',this.ignoreDifficultTerrain)
	}
	switchType(type){
		this.movementMode = type.toLowerCase();
		if(game.combat != null){
			if( typeof game.combat.combatant !='undefined'){
				if(game.combat.combatant.tokenId != this.token.id){
					this.remainingSpeed = 0;
				}else{
					this.remainingSpeed = (this.maxSpeed * ((this.isDashing) ? 2:1)) - this.totalSpeed;
				}
			}
		}else
			this.remainingSpeed = (this.maxSpeed * ((this.isDashing) ? 2:1)) - this.totalSpeed;

	
		this.token.refresh()
		this.token.setFlag('EnhancedMovement','movementMode',this.movementMode)
		this.token.setFlag('EnhancedMovement','remainingSpeed',this.remainingSpeed)
	}
	reset(){
		this.totalSpeed = 0;
		this.remainingSpeed = this.maxSpeed;
		this.isDashing = false;
		this.token.setFlag('EnhancedMovement','remainingSpeed',this.maxSpeed);
		this.token.setFlag('EnhancedMovement','totalSpeed',0)
		this.token.setFlag('EnhancedMovement','nDiagonal',0)
		this.token.setFlag('EnhancedMovement','isDashing', false)
		if(canvas.hud.speedHUD.token != false){
			canvas.hud.speedHUD.updateHUD()
		}
		this.token.refresh();
	}
	endTurn(){
		this.totalSpeed = 0;
		this.remainingSpeed = 0;
		this.isDashing = false;
		this.token.refresh();
		this.token.setFlag('EnhancedMovement','remainingSpeed',0)
		this.token.setFlag('EnhancedMovement','totalSpeed',0)
		this.token.setFlag('EnhancedMovement','isDashing', false)
		this.initialX = this.token.x;
		this.initialY = this.token.y;
	}
	dash(){
		this.isDashing = true;
		this.token.setFlag('EnhancedMovement','isDashing', true)
		this.remainingSpeed = this.remainingSpeed + this.maxSpeed;
		this.token.setFlag('EnhancedMovement','remainingSpeed',this.remainingSpeed);
		if(canvas.hud.speedHUD.token){
			canvas.hud.speedHUD.updateHUD()
		}

	}
	unDash(){
		this.isDashing = false;
		this.token.setFlag('EnhancedMovement','isDashing', false)
		this.remainingSpeed = this.remainingSpeed - this.maxSpeed;
		this.token.setFlag('EnhancedMovement','remainingSpeed',this.remainingSpeed);
		if(canvas.hud.speedHUD.token){
			canvas.hud.speedHUD.updateHUD()
		}
	}
	undo(){
		this.token.setFlag('EnhancedMovement','isUndoing',true).then(() => {
			this.token.update({x: this.initialX, y: this.initialY});
			this.token.setFlag('EnhancedMovement','isUndoing',false).then(() => {
				this.reset();
			});
		});
	}
}
