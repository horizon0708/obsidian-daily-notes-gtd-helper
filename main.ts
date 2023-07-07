import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { DailyNoteGenerator } from "src/daily-note-generator";
import { DailyNoteNavigator } from "src/daily-note-navigator";
import { DailyNoteTickler } from "src/daily-note-tickler";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Sample Plugin",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Notice("This is a notice!");
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");
		const setting = {
			folder: "Daily",
			dailyFormat: "YYYY/MM/YYYY-MM-DD",
		};

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "generate-daily-notes",
			name: "Generate Daily Notes",
			callback: async () => {
				const genrator = new DailyNoteGenerator(this.app, 2023, 7, {
					folder: "Daily",
				});
				await genrator.generateNotes();
			},
		});

		this.addCommand({
			id: "open-next-daily-note",
			name: "Next Daily Note",
			callback: async () => {
				const path = this.app.workspace.activeEditor?.file?.path;
				const nav = new DailyNoteNavigator(this.app, path, setting);
				nav.openOffsetDays(1);
			},
		});

		this.addCommand({
			id: "open-previous-daily-note",
			name: "Previous Daily Note",
			callback: async () => {
				const path = this.app.workspace.activeEditor?.file?.path;
				const nav = new DailyNoteNavigator(this.app, path, setting);
				nav.openOffsetDays(-1);
			},
		});

		this.addCommand({
			id: "append-selection-one-month-later",
			name: "Send Selection to one month Later",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();
				if (!selection) {
					return;
				}
				const path = view.file?.path;
				const dnt = new DailyNoteTickler(this.app, path, setting);
				await dnt.appendToDailyNote(selection);
				console.log(selection);
			},
		});

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");

				new Notice(`${window.moment.now()}`);
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Settings for my awesome plugin." });

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						console.log("Secret: " + value);
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
