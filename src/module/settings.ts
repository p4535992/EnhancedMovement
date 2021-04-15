import { i18n } from './../enhanced-movement';
export const MODULE_NAME = 'EnhancedMovement';

/**
 * Because typescript doesn't know when in the lifecycle of foundry your code runs, we have to assume that the
 * canvas is potentially not yet initialized, so it's typed as declare let canvas: Canvas | {ready: false}.
 * That's why you get errors when you try to access properties on canvas other than ready.
 * In order to get around that, you need to type guard canvas.
 * Also be aware that this will become even more important in 0.8.x because no canvas mode is being introduced there.
 * So you will need to deal with the fact that there might not be an initialized canvas at any point in time.
 * @returns
 */
export function getCanvas(): Canvas {
    if (!(canvas instanceof Canvas) || !canvas.ready) {
        throw new Error("Canvas Is Not Initialized");
    }
    return canvas;
}

export const registerSettings = function () {

  //CONFIG.debug.hooks = true;
    //CONFIG.debug.mouseInteraction = true;
    //console.log(new PathManager)
    // game.settings.register(MODULE_NAME, 'enableGrid', {
    // 	name: "Grid Movement Preview",
    // 	hint: "Displays all points character can move within their speed during combat.",
    // 	scope: "client",
    // 	config: true,
    // 	default: true,
    // 	type: Boolean
  //      //onChange: x => window.location.reload()
  //    });
    // game.settings.register(MODULE_NAME, 'preventMove', {
    // 	name: "Prevent Movement",
    // 	hint: "Restricts movement during combat to only the current token. Will still fire warning.",
    // 	scope: "world",
    // 	config: true,
    // 	default: true,
    // 	type: Boolean
  //      //onChange: x => window.location.reload()
  //    });
  //    game.settings.register(MODULE_NAME, 'disableNonGridMove', {
    // 	name: "Disable Non Grid Movement",
    // 	hint: "During combat, restricts player movement to grid.",
    // 	scope: "world",
    // 	config: true,
    // 	default: true,
    // 	type: Boolean
  //      //onChange: x => window.location.reload()
    // })

    game.settings.register(MODULE_NAME, 'speedLimit', {
      name: i18n(MODULE_NAME+".speedLimit-s"),
      hint: i18n(MODULE_NAME+".speedLimit-l"),
      scope: "world",
      config: true,
      default: true,
      type: Boolean
      //onChange: x => window.location.reload()
    });
}
