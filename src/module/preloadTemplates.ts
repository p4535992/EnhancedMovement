import { MODULE_NAME } from './settings';

export const preloadTemplates = async function () {
	const templatePaths = [
		// Add paths to "module/XXX/templates"
		`/modules/${MODULE_NAME}/templates/speedHUD.html`,
	];

	return loadTemplates(templatePaths);
}
