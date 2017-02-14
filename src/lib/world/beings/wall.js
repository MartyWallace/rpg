import game from '../../game';
import { Being } from '../beings';
import graphics from '../../utils/graphics';

export default class Wall extends Being {
	constructor(cell, def) {
		super(cell, def);

		this.walkable = false;
		this.layer = 'structures';

		this.graphics = PIXI.Sprite.fromImage('/textures/wall.png');
		
		this.setCell(cell);
	}
}