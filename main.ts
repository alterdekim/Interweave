import { Plugin } from 'obsidian';
import * as yaml from "js-yaml";
import $ from "jquery";
import { Color } from '@bluefirex/color-ts';

const radius: number = 80;

class Position {
	public x: number;
	public y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
}

class RenderObject {
	public pos: Position;
	public color: string;

	constructor(pos: Position, color: string) {
		this.pos = pos;
		this.color = color;
	}
}

class Set {
	public id: string;
	public x: number;
	public y: number;
	public vx: number;
	public vy: number;

	constructor(id: string, x: number, y: number, vx: number, vy: number) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.vx = vx;
		this.vy = vy;
	}
}

class Relation {
	public a: string;
	public b: string;
	public shouldIntersect: boolean;

	constructor(a: string, b: string, shouldIntersect: boolean) {
		this.a = a;
		this.b = b;
		this.shouldIntersect = shouldIntersect;
	}
}

class Renderer {

	private static drawFullCircle(ctx: CanvasRenderingContext2D, pos: Position, radius: number, color: string, alpha: number) {
		ctx.beginPath();
		ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
		ctx.fillStyle = color;
		ctx.globalAlpha = alpha;
		ctx.fill();
		ctx.globalAlpha = 1.0;
	}

	private static drawText(ctx: CanvasRenderingContext2D, pos: Position, text: string) {
		ctx.font = '20px Arial';
		const metrics = ctx.measureText(text);
		ctx.fillStyle = 'white';
		ctx.fillText(text, pos.x - metrics.width / 2, pos.y);
	}

	private static drawClip(ctx: CanvasRenderingContext2D, pos: Position, radius: number) {
		ctx.beginPath();
		ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
		ctx.clip();
	}

	private static drawSegment(ctx: CanvasRenderingContext2D, renders: RenderObject[], radius: number, color: string, alpha: number) {
		ctx.save();

		for( let i = 0; i < renders.length - 1; i++ ) {
			Renderer.drawClip(ctx, renders[i].pos, radius);
		}

		const pos = renders[renders.length - 1].pos;

		ctx.beginPath();
		ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
		ctx.fillStyle = color;
		ctx.globalAlpha = alpha;
		ctx.fill();
		ctx.globalAlpha = 1.0;

		ctx.restore();
	}

	static render(data: any, canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext('2d');

		if( ctx == null ) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		data.sort((a: { sets: string | any[]; }, b: { sets: string | any[]; }) => a.sets.length - b.sets.length);

		const poses = Calculator.generatePoses(data, canvas.width - 100, canvas.height);

		let rendered: { [name: string]: RenderObject } = {};

		let pos = 0;

		for( let i = 0; i < data.length; i++ ) {
			const item = data[i];

			if( item.sets.length == 1 ) {
				Renderer.drawFullCircle(ctx, poses[pos], radius, item.color, item.opacity);
				Renderer.drawText(ctx, poses[pos], item.sets[0]);
				rendered[item.sets[0]] = new RenderObject(poses[pos], item.color);
				pos++;
			} else {
				let t = [];
				for( let u = 0; u < item.sets.length; u++ ) {
					t.push(rendered[item.sets[u]]);
				}
				Renderer.drawSegment(ctx, t, radius, item.color, item.opacity);
			}
		}
	}
}

class Calculator {

	private static attractionStrength = Math.pow(10, 5);

	private static getSet(sets: Set[], name: string): Set {
		for( let i = 0; i < sets.length; i++ ) {
			if( sets[i].id == name ) return sets[i];
		}
		return sets[0]; // todo: rewrite that.
	}

	private static calcDistance(a: Set, b: Set): number {
		return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
	}

	private static calcForce(a: Set, b: Set, distance: number): Position {
		const forceDirection = { x: (a.x - b.x) / distance, y: (a.y - b.y) / distance };
		const clampedDistance = Math.max(distance, 0.1);
		const forceMagnitude = Calculator.attractionStrength / (clampedDistance * clampedDistance);
		return { x: forceDirection.x * forceMagnitude, y: forceDirection.y * forceMagnitude };
	}

	private static iterate_positions(sets: Set[], relations: Relation[]): [Set[], Relation[]] {
		for( let i = 0; i < relations.length; i++ ) {
			const relation = relations[i];

			const a = Calculator.getSet(sets, relation.a);
			const b = Calculator.getSet(sets, relation.b);

			let force = { x: 0, y: 0 };

			const distance = Calculator.calcDistance(a, b);

			if( !relation.shouldIntersect ) {
				if( distance < radius * 2.5 ) {
					force = Calculator.calcForce(a, b, distance);

					force.x *= -1;
					force.y *= -1;
				}
			} else {
				if( distance >= radius * 1.7 ) {
					force = Calculator.calcForce(a, b, distance);
				}
			}

			for( let u = 0; u < sets.length; u++ ) {
				if( sets[u].id == a.id || sets[u].id == b.id ) {
					sets[u].vx += sets[u].id == a.id ? force.x * -1 : force.x;
					sets[u].vy += sets[u].id == a.id ? force.y * -1 : force.y;
				}
			}
		}

		for( let i = 0; i < sets.length; i++ ) {
			sets[i].x += sets[i].vx * 1.5;
			sets[i].y += sets[i].vy * 1.5;

			sets[i].vx = 0;
			sets[i].vy = 0;
		}

		return [sets, relations];
	}

	static generatePoses(data: any, w: number, h: number) {
		let sets = [];
		let relations = [];

		for( let i = 0; i < data.length; i++ ) {
			const item = data[i];

			if( item.sets.length < 2 ) {
				sets.push(new Set(item.sets[0], 0, 0, 0, 0));
			} else if ( item.sets.length == 2 ) {
				relations.push(new Relation(item.sets[0], item.sets[1], true));
			}
		}

		const angle = (Math.PI * 2) / sets.length;

		for( let i = 0; i < sets.length; i++ ) {
			let y = Math.sin(angle * i) * 270;
			let x = Math.cos(angle * i) * 270;

			sets[i].x = (w / 2) + x;
			sets[i].y = (h / 2) + y;
		}

		let s = [];
		for( let i = 0; i < sets.length; i++ ) {
			for( let u = 0; u < sets.length && u != i; u++ ) {
				s.push([sets[i].id, sets[u].id]);
			}
		}

		for( let i = 0; i < s.length; i++ ) {
			let found = false;
			for( let u = 0; u < relations.length; u++ ) {
				if( (relations[u].a == s[i][0] && relations[u].b == s[i][1]) || (relations[u].a == s[i][1] && relations[u].b == s[i][0]) ) {
					found = true;
					break;
				}
			}

			if( found ) continue;

			relations.push({ a: s[i][0], b: s[i][1], shouldIntersect: false });
		}

		let iter = 0;
		while(iter < 220) {
			[sets, relations] = Calculator.iterate_positions(sets, relations);
			iter++;
		}

		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		for( let i = 0; i < sets.length; i++ ) {
			minX = Math.min(minX, sets[i].x - radius);
			minY = Math.min(minY, sets[i].y - radius);
			maxX = Math.max(maxX, sets[i].x + radius);
			maxY = Math.max(maxY, sets[i].y + radius);
		}

		for( let i = 0; i < sets.length; i++ ) {
			sets[i].x += ((w - (maxX - minX)) / 2) - minX;
			sets[i].y += ((h - (maxY - minY)) / 2) - minY;
		}

		let poses = [];

		for( let i = 0; i < sets.length; i++ ) {
			poses.push({x: sets[i].x, y: sets[i].y});
		}

		return poses;
	 }
}

export default class InterweavePlugin extends Plugin {

	makeString(): string {
		let outString: string = '';
		let inOptions: string = 'abcdefghijklmnopqrstuvwxyz';
		for (let i = 0; i < 16; i++) {
		  outString += inOptions.charAt(Math.floor(Math.random() * inOptions.length));
		}
		return outString;
	}

	async onload() {
		this.registerMarkdownCodeBlockProcessor("interweave", (source, el) => {
			try {
				let diagram: any = yaml.load(source, { json: true });

				const id = "interweave-"+this.makeString();
				let di = el.createEl("div");
				di.addClass(id);

				const canvas = document.createElement('canvas');
				di.appendChild(canvas);

				canvas.width = 700;
				canvas.height = 400;

				Renderer.render(diagram, canvas);

			} catch(e) {
				console.log(e);
				let di = el.createEl("pre");
				di.setText("Error parsing Interweave diagram.\nIt's syntax should look like this:\n- sets:\n  - A\n  size: 16\n  color: \"#FF0000\"\n  opacity: 0.3");
			}
		});
	}

	onunload() {}
}