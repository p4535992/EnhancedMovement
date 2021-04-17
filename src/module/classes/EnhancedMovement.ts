import { getCanvas, MODULE_NAME } from "../settings";

export default class EnhancedMovement {


  token:Token;
  actor:Actor;
  totalSpeed:number;
  isDashing:boolean;
  movementMode:string;
  nDiagonals:number;
  ignoreDifficultTerrain:boolean;
  remainingSpeed:number;

  initialX:number;
  initialY:number;

  movementTypes:any;

	constructor(token){

		this.token = token;
		this.actor = this.token.actor;
		this.totalSpeed = <number>this.token.getFlag(MODULE_NAME,'totalSpeed') ?? 0;
		this.isDashing =  <boolean>this.token.getFlag(MODULE_NAME,'isDashing') ?? false;
		this.movementMode = (typeof this.token.getFlag(MODULE_NAME,'movementMode') != 'undefined') ? <string>this.token.getFlag(MODULE_NAME,'movementMode'):'walk';
		this.nDiagonals = <number>this.token.getFlag(MODULE_NAME,'nDiagonal') ?? 0;
		this.ignoreDifficultTerrain = <boolean>this.token.getFlag(MODULE_NAME,'ignoreDifficultTerrain') ?? false;
		this.getMovementTypes();
		this.remainingSpeed =  this.token.getFlag(MODULE_NAME,'remainingSpeed') ?? this.maxSpeed;//(this.maxSpeed * ((this.isDashing) ? 2:1)) - this.totalSpeed;
		this.token.setFlag(MODULE_NAME,'isUndoing',false);

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
		await this.token.unsetFlag(MODULE_NAME,'remainingSpeed').then(()=>{
			this.token.setFlag(MODULE_NAME,'remainingSpeed', this.remainingSpeed);
		});

	}
	addMovementType(type,speed){
		type = type.toLowerCase();
		speed = parseFloat(speed);
		this.movementTypes[type.toLowerCase()]={
			maxSpeed:speed
		}
		if(getCanvas().hud['speedHUD'].token.id != this.token.id){
			getCanvas().hud['speedHUD'].updateHUD()
		}
		this.token.refresh();
	}
	removeMovementType(type){
		type = type.toLowerCase();
		if(this.movementMode == type){
			this.movementMode = 'walk';
		}
		delete this.movementTypes[type];
	}
	toggleIgnoreTerrain(){
		this.ignoreDifficultTerrain = !this.ignoreDifficultTerrain;
		this.token.setFlag(MODULE_NAME,'ignoreDifficultTerrain',this.ignoreDifficultTerrain)
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
		this.token.setFlag(MODULE_NAME,'movementMode',this.movementMode)
		this.token.setFlag(MODULE_NAME,'remainingSpeed',this.remainingSpeed)
	}
	reset(){
		this.totalSpeed = 0;
		this.remainingSpeed = this.maxSpeed;
		this.isDashing = false;
		this.token.setFlag(MODULE_NAME,'remainingSpeed',this.maxSpeed);
		this.token.setFlag(MODULE_NAME,'totalSpeed',0)
		this.token.setFlag(MODULE_NAME,'nDiagonal',0)
		this.token.setFlag(MODULE_NAME,'isDashing', false)
		if(getCanvas().hud['speedHUD'].token != false){
			getCanvas().hud['speedHUD'].updateHUD()
		}
		this.token.refresh();
	}
	endTurn(){
		this.totalSpeed = 0;
		this.remainingSpeed = 0;
		this.isDashing = false;
		this.token.refresh();
		this.token.setFlag(MODULE_NAME,'remainingSpeed',0)
		this.token.setFlag(MODULE_NAME,'totalSpeed',0)
		this.token.setFlag(MODULE_NAME,'isDashing', false)
		this.initialX = this.token.x;
		this.initialY = this.token.y;
	}
	dash(){
		this.isDashing = true;
		this.token.setFlag(MODULE_NAME,'isDashing', true)
		this.remainingSpeed = this.remainingSpeed + this.maxSpeed;
		this.token.setFlag(MODULE_NAME,'remainingSpeed',this.remainingSpeed);
		if(getCanvas().hud['speedHUD'].token){
			getCanvas().hud['speedHUD'].updateHUD()
		}

	}
	unDash(){
		this.isDashing = false;
		this.token.setFlag(MODULE_NAME,'isDashing', false)
		this.remainingSpeed = this.remainingSpeed - this.maxSpeed;
		this.token.setFlag(MODULE_NAME,'remainingSpeed',this.remainingSpeed);
		if(getCanvas().hud['speedHUD'].token){
			getCanvas().hud['speedHUD'].updateHUD()
		}
	}
	undo(){
		this.token.setFlag(MODULE_NAME,'isUndoing',true).then(() => {
			this.token.update({x: this.initialX, y: this.initialY});
			this.token.setFlag(MODULE_NAME,'isUndoing',false).then(() => {
				this.reset();
			});
		});
	}
}
