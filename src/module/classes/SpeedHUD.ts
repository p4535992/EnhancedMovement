import { getCanvas, MODULE_NAME } from "../settings";

const speedUI = {
	walk:{
		name:'walk',
		icon:"fas fa-walking"
	},
	dash:{
		name:'dash',
		icon:"fas fa-running"
	},
	swim:{
		name:'swim',
		icon:"fas fa-swimmer"
	},
	fly:{
		name:'fly',
		icon:"wings"
	},
	climb:{
		name:'climb',
		icon:"fas fa-hand-rock"
	},
	burrow:{
		name:'burrow',
		icon:"shovel"
	}
}
export class SpeedHUD extends Application {

  object;
  mode;
  token;
  em;
  listeners;
  data;
  movementTypes = {};

	constructor(options={}){
		super(options);
		this.object = {};
		this.mode = null;
		this.token = false;
		this.em = null;
		this.listeners = false;
		this.data = {
			on:"",
			name:"",
			modeIcon:null,
			speedUnit: 'FT',
			remainingSpeed:0,
			modes: null,
			modeList:null
		}
		Hooks.on('updateSpeedHUD',(hud)=>{
			//console.log(hud);
		})
	}
	// set currentToken(val){
	// 	this._currentToken = val;

	// }
	get modes(){
		return this.movementTypes;
	}

	listModes(mode,otherModes){
		let list = [];
		for (let key in otherModes){
			if(key != this.mode){
				list.push(key);
			}
		}
		return list;
	}

	/* I'm not dealing with multiple tokens. I'm only worried about singular tokens */
	get controlled(){
		return getCanvas().tokens.controlled[0] || false;
	}

	/*
	* Assign the default options which are supported by the entity edit sheet
	* @type {Object}
	*/
	static get defaultOptions() {
		//@ts-ignore
		return mergeObject(super.defaultOptions, {
			id: "speedHUD",
			classes: ["app"],
			popOut: false,
			template: "modules/"+MODULE_NAME+"/templates/speedHUD.html"
		});
	}

	getData(options={}) {
		return {
		active:(this.token) ? true:false,
		data:this.data,
		options: this.options,
		ui:speedUI
		}
	}

  	//@ts-ignore
	setPosition(options) {
	   	this.element.css(
        {
           bottom:window.innerHeight - $('#players').offset().top+15
        }
      )
 	}
 	_injectHTML(html, options) {
	    $('body').append(html);
	    this._element = html;

	}
	activateListeners(html) {

	 	const moveSpeed = this.element.find('#moveSpeed');
	 	const mode = this.element.find('#mode');

	 	moveSpeed.off();
	 	$('body').off('click','#speedHUD li');


	 	moveSpeed.keypress(function(e) {
	 		if(e.which == 13){
				this.blur();
				e.preventDefault();
				return false;
			}
			if (isNaN(parseInt(String.fromCharCode(e.which)))){
				e.preventDefault();
			}
		});
		moveSpeed.on('focus',(e)=>{
			console.log('focus')
		})
		moveSpeed.on('blur',(e)=>{
			let speed = parseFloat(e.target.innerText);
			this.updateMovement(speed);

			console.log('blur')
		})
		$('body').on('click','#speedHUD li',(e)=>{
			//console.log('test',$(e.target).attr('data-type'))
			this.updateMode($(e.target).attr('data-type'),true)
		})
	}
	/***
	*
	*
	***/

	updateMovement(speed){
		this.em.remainingSpeed = parseFloat(speed.toFixed(2));
		this.token.refresh();
		this.token.setFlag(MODULE_NAME,'remainingSpeed',parseFloat(speed.toFixed(2)))
		Hooks.call('updateSpeedHUD',this);
	}

	/*
	type: (string) 'fly' or 'swim'
	speed: (Number) 30 or 7.5
	*/
	addMode(type,speed){
		this.em.addMovementType(type,speed);
		this.updateHUD()
	}

	updateTracker(rerender = false){
		if(game.combat != null && game.combat.round > 0 && game.combat.combatants.length > 0){
			if(this.token.id == game.combat.combatant.tokenId){
				this.data.on = 'on';
			} else {
				this.data.on = 'off';
			}
		} else {
			this.data.on = '';
		}

		if(rerender){
			this.render();
		}
	}

	updateMode(mode,rerender = false){

		this.em.switchType(mode)

	 	this.updateHUD()


	 	switch(mode){
	 		case 'dash':
	 			break;

	 		default:
	 		break;
	 	}
	}

	updateHUD(render=true,updates={}){

		if(this.token == false){
			this.data = mergeObject(this.data,updates);
		}else{
			this.em = this.token[MODULE_NAME];
			if(!this.em){
				this.em = this.token;
			}
			this.movementTypes = this.em.movementTypes;

			this.mode = this.em.movementMode || this.em.getFlag(MODULE_NAME,'movementMode') || 'walk';
			this.data.modes = this.modes;
			this.updateTracker()
			//console.log(this.movementTypes)
			this.data.name = (this.token) ? this.token.data.name:"";
			updates = mergeObject(updates,{

				modeIcon:speedUI[this.mode].icon,
				speedUnit: getCanvas().scene.data.gridUnits,
				remainingSpeed:Math.max(this.em.remainingSpeed,0),
				modeList:this.listModes(this.mode,this.movementTypes)
			});
			this.data = mergeObject(this.data,updates);
		}

		if(render){
			this.render(true);
		}
		// this.element.addClass('active');
		// this.element.find('#token-name').html(this.data.name);
		// this.element.find('#mode').attr('class',`movement-mode ${this.data.modeIcon}`)
		// this.element.find('#turn-tracker').attr('class',`turn-indicator ${this.data.on}`)
		// this.element.find('#moveSpeed').html(this.data.remainingSpeed);
	}

	get modeIcon(){
		return this.movementTypes[this.mode].modeIcon;
	}
	/*get canMove(){
		if(game.combat.combatant.tokenId == this.controlled.id)
			return true;
	}*/

}
// Hooks.on('renderPlayerList',()=>{
// 	if(typeof getCanvas().hud['speedHUD'] != 'undefined'){
//     getCanvas().hud['speedHUD'].element.css(
//       {
//         bottom:window.innerHeight - $('#players').offset().top+15
//       }
//     )
//   }
// })
