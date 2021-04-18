import { log, warn } from "../enhanced-movement";
import EnhancedMovement from "./classes/EnhancedMovement";
import { Overwrite } from "./Overwrite";
import { getCanvas, MODULE_NAME } from "./settings";

//@ts-ignore
import { PathManager } from "/modules/lib-find-the-path/scripts/pathManager.js";
//@ts-ignore
import { MinkowskiParameter,PointFactory } from "/modules/lib-find-the-path/scripts/point.js";

let speed;
let combat;
let cToken;
let stopMovement = false;
let gmAltPress = false;

let pathManager = new PathManager (MinkowskiParameter.Chebyshev);

let nDiagonal = 0;
let interval = null;

export let readyHooks = async () => {

  Hooks.on('canvasReady',()=>{
    //getCanvas().grid.addHighlightLayer(`${MODULE_NAME}.${game.userId}`);
    //getCanvas().hud.speedHUD = new SpeedHUD();
    getCanvas().tokens.placeables.forEach((token)=>{
      if(typeof token.actor != 'undefined'){
        //token.movementGrid = new MovementGrid(token);
        token[MODULE_NAME] = new EnhancedMovement(token);
      }
    })

    getCanvas().hud['speedHUD'].updateHUD()
    //Allows GM to override movement restrictions.
     if (game.user.isGM){
      $(window).on('keydown',(e)=>{
        switch(e.which){
          case 18:
            gmAltPress = true;
            break;
          default:
            break;
        }

      })
      $(window).on('keyup',(e)=>{
        switch(e.which){
          case 18:
            gmAltPress = false;
            break;
          default:
            break;
        }

      })
    }
    $('body').on('click','#dash-btn',function(e){
      if($(this).hasClass('active')){
        if(getCanvas().tokens.controlled[0][MODULE_NAME].totalSpeed < getCanvas().tokens.controlled[0][MODULE_NAME].maxSpeed){
          $(this).removeClass('active')
          getCanvas().tokens.controlled[0][MODULE_NAME].unDash();
        }

      }else{
        $(this).addClass('active');
        getCanvas().tokens.controlled[0][MODULE_NAME].dash();
      }
    })
    $('body').on('click','#undo-btn', function(e) {
      getCanvas().tokens.controlled[0][MODULE_NAME].undo();
    })
    //Create SPEEDUI
    //game.user.speedHUD = new SpeedHUD().render(true);
    getCanvas().hud['speedHUD'].render(true);
  });

  //COMBAT HOOKS
  Hooks.on('createCombat',(combat,data,userID)=>{

  });

  Hooks.on('updateCombat',(combat,data,diff,userID)=>{


    //console.log(combat.previous.round,combat.previous.turn,combat.current.round,combat.current.turn,data,diff,userID)
    let token = (typeof combat.combatant != 'undefined') ? getCanvas().tokens.get(combat.combatant.tokenId):null;

    if(diff.diff && game.user.isGM){
      if((data.hasOwnProperty('turn') || data.hasOwnProperty('round')) && combat.combatant !=null){
        //New Turn

        token.setFlag(MODULE_NAME,'nDiagonal',0)

        if(data.hasOwnProperty('round')){
          //new round

          let nonCombatTokens = getCanvas().tokens.placeables.filter((token)=>{
            let index = game.combat.combatants.findIndex((combatant)=>{
              return token.id == combatant.tokenId;
            })
            if(index == -1) return true;
            else return false;

          })
          nonCombatTokens.forEach((token)=>{
            token[MODULE_NAME].reset();
          })

        }
        game.combat.combatants.forEach((c)=>{
          if(c.tokenId != game.combat.combatant.tokenId)
            getCanvas().tokens.get(c.tokenId)[MODULE_NAME].endTurn();
        })

        token[MODULE_NAME].reset();
        // token.setFlag(MODULE_NAME,'remainingSpeed',token.maxSpeed).then(()=>{
        // 	//if(token._controlled) token.movementGrid.highlightGrid();
        // });
        if(token.id == getCanvas().hud['speedHUD'].token.id){
          getCanvas().hud['speedHUD'].updateTracker()
        }else{
          getCanvas().hud['speedHUD'].updateTracker();
        }
      }

      if(data.round == 1 && combat.previous.round !== 2 && game.user.isGM){
        //Combat Started
        if(token !== null){
          getCanvas().hud['speedHUD'].token = token;
          getCanvas().hud['speedHUD'].updateHUD();
          getCanvas().hud['speedHUD'].updateTracker()
        }
        getCanvas().tokens.placeables.forEach((token)=>{
          token[MODULE_NAME].reset()
          token.refresh();
        });

      }
    }
  });

  Hooks.on('deleteCombat',async (combat)=>{
    if(game.user.isGM){
      // combat.combatants.map((combatant)=>{
      // 	let token = getCanvas().tokens.get(combatant.tokenId);
      // 	token[MODULE_NAME].reset();
      // 	getCanvas().hud['speedHUD'].updateTracker()


      // });
      getCanvas().tokens.placeables.forEach((token)=>{
        token[MODULE_NAME].reset();
        token.refresh();
        if(getCanvas().hud['speedHUD'].token != false)
          getCanvas().hud['speedHUD'].updateTracker()
        //token.movementGrid.clear();
      })
    }
  });

  Hooks.on('createCombatant',(combat,combatant,data,)=>{
    if(getCanvas().hud['speedHUD'].token.id == combatant.tokenId){
      getCanvas().hud['speedHUD'].updateTracker();
    }
  });

  //TOKEN HOOKS
  Hooks.on('controlToken',(token,controlled)=>{

    //If user selects multiple tokens, this will be last one selected
    cToken = (controlled) ? token:null;

    if(controlled){
      getCanvas().hud['speedHUD'].token = token;
      getCanvas().hud['speedHUD'].updateHUD();

    }else{
      getCanvas().hud['speedHUD'].token = false;

      setTimeout(()=>{

        if(getCanvas().hud['speedHUD'].token){
          getCanvas().hud['speedHUD'].updateHUD();
        }else{
          getCanvas().hud['speedHUD'].close();
        }
      },200)
    }

    // GET FROM SPEED HUD CLASS

    Hooks.on('renderPlayerList',()=>{
      if(typeof getCanvas().hud['speedHUD'] != 'undefined'){
        getCanvas().hud['speedHUD'].element.css(
          {
            bottom:window.innerHeight - $('#players').offset().top+15
          }
        )
      }
    })

  });


  Hooks.on('preUpdateToken', (scene,tokenData,updates,diff)=>{
    //if(game)
    let token = getCanvas().tokens.get(tokenData._id)
    if(game.combat !== null && (typeof updates.y != 'undefined' || typeof updates.x != 'undefined') && token.getFlag(MODULE_NAME,'isUndoing') !== true){
      let nDiagonal = <number>token.getFlag(MODULE_NAME,'nDiagonal') || 0;
      const prev = {x:token.x,y:token.y}
      const next = {x:updates.x ?? token.x,y:updates.y ?? token.y}

      let [nextX,nextY] = getCanvas().grid.grid.getGridPositionFromPixels(next.x,next.y);
      let [prevX,prevY] = getCanvas().grid.grid.getGridPositionFromPixels(prev.x,prev.y);
      const dy =  (next.y-prev.y) / getCanvas().dimensions.size;
      const dx = (next.x-prev.x) / getCanvas().dimensions.size;
      const ny = Math.abs(dy);
      const nx = Math.abs(dx);
      let nd = Math.min(nx, ny);
        let ns = Math.abs(ny - nx);

      let distance = 0;
        //Gets all point between start and end.
       let path = calcStraightLine ([prevX,prevY],[nextX,nextY]);
       path.forEach((point)=>{
           let terrainInfo = checkForTerrain(point[0],point[1])
           if(terrainInfo){
             if(terrainInfo.type == 'ground'
              //&& token[MODULE_NAME].movementMode == 'walk' 
              && token.getFlag(MODULE_NAME,'movementMode')  == 'walk'
              //&& !token[MODULE_NAME].ignoreDifficultTerrain)
              && !token.getFlag(MODULE_NAME,'ignoreDifficultTerrain')
             ){
              distance += (terrainInfo.multiple * getCanvas().scene.data.gridDistance) - getCanvas().scene.data.gridDistance;
             }

           }
       })

      nDiagonal += nd;
      if(!token.data.flags[MODULE_NAME]){
        token.data.flags[MODULE_NAME] = {};
      }
      //@ts-ignore
      token.data.flags[MODULE_NAME].nDiagonal = nDiagonal;
      token.setFlag(MODULE_NAME,'nDiagonal',nDiagonal);
      //@ts-ignore
      if(getCanvas().grid.diagonalRule == '555'){
        let d = Math.floor(ns + nd) * getCanvas().scene.data.gridDistance;
        distance += d + ((getCanvas().scene.data.gridType > 1) ? getCanvas().scene.data.gridDistance:0);

      }
      //@ts-ignore
      else if(getCanvas().grid.diagonalRule =='5105'){

          let nd10 = Math.floor(nDiagonal / 2) - Math.floor((nDiagonal - nd) / 2);
          let spaces = (nd10 * 2) + (nd - nd10) + ns;
          distance += spaces * getCanvas().dimensions.distance;
      }
      //Hex Distances are only 3.75 for some reason, we need to clamp this so it's always at least 5.
      if(distance < getCanvas().scene.data.gridDistance){
        distance = getCanvas().scene.data.gridDistance;
      }
      if(gmAltPress){
        distance = 0;
      }
      let speed = token[MODULE_NAME].remainingSpeed || token.getFlag(MODULE_NAME,'remainingSpeed') ;

      let modSpeed = speed - distance;
      if(modSpeed < 0 && !gmAltPress){
        /// need to broadcast this.

        ui.notifications.warn("Creature has exceeded their movement speed this turn.", {permanent: false});
        return false;
      }else{
        token[MODULE_NAME].totalSpeed += distance;
        token.setFlag(MODULE_NAME,'totalSpeed', token[MODULE_NAME].totalSpeed)
        token[MODULE_NAME].remainingSpeed = (modSpeed < 0) ? 0:modSpeed;
        token[MODULE_NAME].updateMovementSpeedFlag();

        getCanvas().hud['speedHUD'].updateHUD()
      }

      if( game.combat.started && game.combat.combatant.tokenId == tokenData._id){
        // DO NOTHING
      }else if(!gmAltPress && game.combat.started  && game.combat.combatants.findIndex((i)=>{return i.tokenId == token.id}) !== -1){
        ui.notifications.warn("It is not your move.", {permanent: false});
        //return false;
      }
    }
  });


  Hooks.on('updateToken',(scene,tokenData,updates,diff)=>{
    let token = getCanvas().tokens.get(tokenData._id)
    if(updates.hasOwnProperty('flags')){
      if(updates.flags.hasOwnProperty(MODULE_NAME)){
        if(updates.flags[MODULE_NAME].hasOwnProperty('remainingSpeed')){
          token[MODULE_NAME].remainingSpeed = updates.flags[MODULE_NAME].remainingSpeed;
          //token[MODULE_NAME].updateMovementSpeedFlag();
          token.refresh();

          if(getCanvas().hud['speedHUD'].token.id == token.id){
            getCanvas().hud['speedHUD'].updateHUD();
          }
        }
      }
    }
    //Combat has started


    if(updates.hasOwnProperty('x') || updates.hasOwnProperty('y')){
      //token.movementGrid.clear();
      if(interval == null) {
        interval = setInterval(()=>{

          if(token['_movement'] == null){
            clearInterval(interval);
            interval = null;
            Hooks.call('moveToken',token)
          }
        },100)
      }
    }

  });

  Hooks.on('moveToken',(token)=>{
    if(game.user.isGM) {
      if(game.combat !== null && game.combat.started){
        //if(game.combat.combatant.tokenId == token.id) token.movementGrid.highlightGrid();
      }
      token.previousLocation.push({x:token.x,y:token.y});
    }
  });

  Hooks.on('createToken',(scene,tokenData)=>{
    if(game.user.isGM){
      let token = getCanvas().tokens.get(tokenData._id);
      token[MODULE_NAME] = new EnhancedMovement(token);
      token[MODULE_NAME].updateMovementSpeedFlag();
      //token.setFlag(MODULE_NAME,'remainingSpeed',token[MODULE_NAME].maxSpeed);
    }
  });

  //ACTOR HOOKS
  Hooks.on('updateActor',async (actor,data,diff,userID)=>{
    if(typeof data.data.attributes.speed.value != 'undefined') {
      let newSpeed = data.data.attributes.speed.value;
      let tokens = getTokensFromActor(actor);
      if(tokens.length > 0){
        tokens.forEach((token)=>{
          let diff = token[MODULE_NAME].remainingSpeed - token[MODULE_NAME].maxSpeed;

          token[MODULE_NAME].remainingSpeed = newSpeed - diff;
          getCanvas().hud['speedHUD'].updateHUD()
          token.unsetFlag(MODULE_NAME,'remainingSpeed').then(()=>{
            token.setFlag(MODULE_NAME,'remainingSpeed', newSpeed-diff);
          })

          token.refresh();

          //if(token.movementGrid.visible == true) token.movementGrid.highlightGrid();
        })
      }
    }
    if(typeof data.data.attributes.speed.special != 'undefined'){
       let special = data.data.attributes.speed.special;

      let tokens = getTokensFromActor(actor);
      if(tokens.length > 0){
        tokens.forEach((token)=>{
          token[MODULE_NAME].getMovementTypes();
          if(getCanvas().hud['speedHUD'].token.id == token.id){
            getCanvas().hud['speedHUD'].updateHUD();
          }
        });
      }
    }
  });

  Hooks.on('renderTokenHUD',(tokenHUD,element,data)=>{
    let token = getCanvas().tokens.get(data._id)
    //let isDashing = (token[MODULE_NAME].isDashing) ? 'active':''
    let isDashing = <boolean>token.getFlag(MODULE_NAME,'isDashing')  ? 'active':'';
    element.find('.elevation').append(`<div id="dash-btn" class="control-icon fas fa-running ${isDashing}"></div>`)
    element.find('.elevation').append(`<div id="undo-btn" class="control-icon fas fa-undo"></div>`)
  });

  // Not exists on libWrapper
  // libWrapper.register(MODULE_NAME, 'HeadsUpDisplay.prototype.speedHUD', Overwrite.HeadsUpDisplayPrototypeSpeedHUDHandler, 'WRAPPER');
  // Not exists on libWrapper
  //libWrapper.register(MODULE_NAME, 'Token.prototype.previousLocation', Overwrite.TokenPrototypePreviousLocationHandler, 'WRAPPER');

  //@ts-ignore
  libWrapper.register(MODULE_NAME, 'PlaceableObject.prototype.clone', Overwrite.PlaceableObjectPrototypeCloneHandler, 'WRAPPER');
  //@ts-ignore
  libWrapper.register(MODULE_NAME, 'Token.prototype.draw', Overwrite.TokenPrototypeDrawHandler, 'WRAPPER');
  //@ts-ignore
  libWrapper.register(MODULE_NAME, 'Token.prototype.refresh', Overwrite.TokenPrototypeRefreshHandler, 'WRAPPER');
  // Not exists on libWrapper
  // libWrapper.register(MODULE_NAME, 'Token.prototype._clearSpeedUI', Overwrite.TokenPrototypeClearSpeedUIHandler, 'WRAPPER');
  // Not exists on libWrapper
  // libWrapper.register(MODULE_NAME, 'Token.prototype._drawSpeedUI', Overwrite.TokenPrototypeDrawSpeedUIHandler, 'WRAPPER');

}

export let initHooks = () => {
  warn("Init Hooks processing");

  Overwrite.init();

}


// =================================
// HELPER FUNCTION
// =================================

function getTokensFromActor(actor){
  return getCanvas().tokens.placeables.filter(t => t.actor.id === actor.id);
}


function checkForTerrain(x,y){

  if(typeof getCanvas()['terrain'].costGrid[x] == 'undefined'){
    return false
  }
  if(typeof getCanvas()['terrain'].costGrid[x][y] == 'undefined'){
    return false
  }
  return getCanvas()['terrain'].costGrid[x][y];
}

async function getPath(originPt,destPt,range,token){
  originPt = PointFactory.segmentFromPoint(originPt)
  destPt = PointFactory.segmentFromPoint(destPt)
  const path = await PathManager.pathToSegment (originPt,destPt,range);
  // const path = await pathManager.pathFromData({
  // 	"origin": originPt,
  // 	"dest": destPt,
  // 	"token": token, // Gets the width and height of the token that is being moved
  // 	"movement": range
  // })
  console.log (path.path);
}

function calcStraightLine (startCoordinates, endCoordinates) {
  var coordinatesArray = new Array();
  // Translate coordinates
  var x1 = startCoordinates[0];
  var y1 = startCoordinates[1];
  var x2 = endCoordinates[0];
  var y2 = endCoordinates[1];
  // Define differences and error check
  var dx = Math.abs(x2 - x1);
  var dy = Math.abs(y2 - y1);
  var sx,sy;
  if(getCanvas().scene.data.gridType == 0){
   sx = (x1 < x2) ? 10 : -10;
     sy = (y1 < y2) ? 10 : -10;
  }else{
     sx = (x1 < x2) ? 1 : -1;
     sy = (y1 < y2) ? 1 : -1;
  }
  var err = dx - dy;
  // Set first coordinates
  //coordinatesArray.push([x1, y1]);
  // Main loop
  while (!((x1 == x2) && (y1 == y2))) {
      var e2 = err << 1;
      if (e2 > -dy) {
          err -= dy;
          x1 += sx;
      }
      if (e2 < dx) {
          err += dx;
          y1 += sy;
      }
      // Set coordinates
      coordinatesArray.push([x1, y1]);
  }
  // Return the result
  return coordinatesArray;
}
