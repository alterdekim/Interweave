import { App, Editor, MarkdownView, Plugin } from 'obsidian';
import * as venn from "@upsetjs/venn.js";
import * as d3 from "d3";
import * as yaml from "js-yaml";
import $ from "jquery";
import { Color } from '@bluefirex/color-ts';

export default class MyPlugin extends Plugin {

	makeString(): string {
		let outString: string = '';
		let inOptions: string = 'abcdefghijklmnopqrstuvwxyz';
		for (let i = 0; i < 16; i++) {
		  outString += inOptions.charAt(Math.floor(Math.random() * inOptions.length));
		}
		return outString;
	}
	

	async onload() {
		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

		this.registerMarkdownCodeBlockProcessor("interweave", (source, el, ctx) => {
			try {
				let diagram: any = yaml.load(source, { json: true });
				const id = "interweave-"+this.makeString();
				let di = el.createEl("div");
				di.addClass(id);
				var chart = venn.VennDiagram();
				d3.select(di).datum(diagram).call(chart);
				for( let i = 0; i < diagram.length; i++ ) {
					const d_element = diagram[i];
					d_element.color = d_element.color == undefined ? "#FF0000" : d_element.color;
					d_element.opacity = d_element.opacity == undefined ? 0.4 : d_element.opacity;
					const sets: string = d_element.sets.join("_");
					window.setTimeout(function() {
						$("."+id).find("g")
							.toArray()
							.filter((element) => $(element).attr("data-venn-sets") == sets)
							.forEach((element) => $(element).find("path").css({"fill-opacity": d_element.opacity, "fill": d_element.color}));
						let clr = Color.fromString(d_element.color);
						try {
							if( clr == null ) {
								throw new Error('Null color');
							}
							$("."+id).find("g")
								.toArray()
								.filter((element) => $(element).attr("data-venn-sets") == sets)
								.forEach((element) => $(element).find("text").css("fill", clr.isDark() ? "#FFFFFF" : "#000000"));
						} catch(e) {
							$("."+id).find("g")
								.toArray()
								.filter((element) => $(element).attr("data-venn-sets") == sets)
								.forEach((element) => $(element).find("text").css("fill", "#FFFFFF"));
						}
					}, 80);
				}
			} catch(e) {
				let di = el.createEl("pre");
				di.setText("Error parsing Interweave diagram.\nIt's syntax should look like this:\n- sets:\n  - A\n  size: 16\n  color: \"#FF0000\"\n  opacity: 0.3");
			}
		});
	}

	onunload() {}
}