import { App, Editor, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';
import * as venn from "@upsetjs/venn.js";
import * as d3 from "d3";
import * as yaml from "js-yaml";
import $ from "jquery";
import { Color } from '@bluefirex/color-ts';
// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	makeString(): string {
		let outString: string = '';
		let inOptions: string = 'abcdefghijklmnopqrstuvwxyz';
		for (let i = 0; i < 16; i++) {
		  outString += inOptions.charAt(Math.floor(Math.random() * inOptions.length));
		}
		return outString;
	}
	

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

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
					const element = diagram[i];
					const sets: string = element.sets.join("_");
					window.setTimeout(function() {
						$("."+id).find("g[data-venn-sets="+sets+"]").find("path").css({"fill-opacity": element.opacity, "fill": element.color});
						let clr = Color.fromString(element.color);
						const txt_obj = $("."+id).find("g[data-venn-sets=\""+sets+"\"]").find("text");
						try {
							if( clr == null ) {
								throw new Error('Null color');
							}
							txt_obj.css("fill", clr.isDark() ? "#FFFFFF" : "#000000");
						} catch(e) {
							txt_obj.css("fill", "#FFFFFF");
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

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
