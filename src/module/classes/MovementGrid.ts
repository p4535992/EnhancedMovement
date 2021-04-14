
import { getCanvas } from "../settings"
//@ts-ignore
import { PathManager } from "/modules/lib-find-the-path/scripts/pathManager.js";
//@ts-ignore
import { PointFactory, AngleTypes } from "/modules/lib-find-the-path/scripts/point.js";
//@ts-ignore
import { MinkowskiParameter } from "/modules/lib-find-the-path/scripts/point.js";
//@ts-ignore
import { FTPUtility } from "/modules/lib-find-the-path/scripts/utility.js"

export default class MovementGrid {

  id:string;
  user:User;

  borderColor:string;
  fillColor:string;
  token:Token;
  name:string;
  pf:any;
  PM:any;
  visible:boolean;
  points:any[];

	constructor(token) {
		this.id = game.userId;
		this.user = game.user;

		this.borderColor = game.user.color;
		this.fillColor = game.user.color;
		this.token = token;
		this.name = `EnhancedMovement.${token._id}`;
    //@ts-ignore
		this.pf = game.FindThePath.Chebyshev.PointFactory;
		this.PM = new PathManager (MinkowskiParameter.Chebyshev);
    this.visible = false;
    this.points = [];
		getCanvas().grid.addHighlightLayer(this.name);

	}
	async highlightGrid(dash=false) {
		console.log('highlightGrid')
		this.clear();
	  const center = this.token.center;
		let speed = this.token.remainingSpeed;
		const spaces = speed / getCanvas().dimensions.distance;
		const gridPos = getCanvas().grid.grid.getGridPositionFromPixels(center.x,center.y) // [row,col]

		const oRow = gridPos[0];
		const oCol = gridPos[1];

		let origin =  this.pf.fromToken(this.token);
		const multiple = (dash) ? 2:1;

		this.points = await PathManager.pointsWithinRange(origin,spaces*multiple);
		let move = this.points;

		for (let i =0;i<move.length;i++){
			//let color = colorStringToHex(this.user.data.color);
			let color = (move[i].cost > spaces) ? colorStringToHex('#00ff00'):colorStringToHex(this.user.data.color);
			getCanvas().grid.highlightPosition(this.name, {x: move[i].px, y: move[i].py,color:color});
		}
		this.visible = true;
	}
	clear(){
		getCanvas().grid.highlightLayers[this.name].clear();
		this.visible = false;
	}

	static didCollide(A,B){
		let ray = new Ray(A,B);
		return getCanvas().walls.checkCollision(ray);
	}
}
