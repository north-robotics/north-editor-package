'use babel';

import path from 'path';
import childProcess from 'child_process';
import fs from 'fs-plus';
import { CompositeDisposable } from 'atom';
import NewProjectView from './new-project-view';
const app = require('electron').remote.app;

const newProjectMenu = {
  label: "New Project...",
  command: "north-editor:new-project"
}

const runMenu = {
  "label": "Run",
  "submenu": [
    {
      "label": "Open iPython Terminal",
      "command": "north-editor:terminal"
    },
    {
      "label": "Install Requirements",
      "command": "north-editor:install-requirements"
    }
  ]
}

const toolbarItems = [
  { icon: 'file', iconset: 'fa', callback: 'application:new-file', tooltip: "New File" },
  { icon: 'folder-plus', iconset: 'mdi', callback: 'north-editor:new-project', tooltip: "New Python Project" },
  { icon: 'folder-open', iconset: 'fa', callback: 'application:open-file', tooltip: "Open File" },
  { icon: 'save', iconset: 'fa', callback: 'core:save', tooltip: "Save File" },
  { type: 'spacer' },
  { icon: 'file-play', iconset: 'icomoon', callback: 'north-editor:run-current-python-file', tooltip: "Run Current Python File" },
  { icon: 'presentation-play', iconset: 'mdi', callback: 'north-editor:run-main-python-file', tooltip: "Run main.py" },
  { type: 'spacer' },
  { icon: 'package-down', iconset: 'mdi', callback: 'north-editor:install-requirements', tooltip: "Install Python Requirements" },
  { icon: 'terminal', callback: 'north-editor:ipython-terminal', tooltip: "Python Console" },
  { icon: 'hubot', callback: 'north-editor:open-simulator', tooltip: "Open N9 Simulator" },
];

export default {
  subscriptions: null,

  //
  // Config
  //

  config: {
    n9SimulatorPath: {
      title: "N9 Simulator Path",
      type: "string",
      default: "..\\..\\N9 Simulator\\N9 Simulator.exe"
    },
    pythonPath: {
      title: "Python Executable",
      type: "string",
      default: "python"
    },
    mainPythonFilename: {
      title: "Main Python Filename",
      type: "string",
      default: "main.py"
    }
  },

  activate(state) {
    this.initConfig();
    this.initSubcriptions();
    this.initMenu();
  },

  deactivate() {
    if(this.newProjectView) this.newProjectView.destroy();
    this.subscriptions.dispose();
  },

  //
  // Init
  //

  initConfig() {
    // core
    atom.config.set('core.automaticallyUpdate', false);
    atom.config.set('core.disabledPackages', ['welcome']);
    atom.config.set('core.telemetryConsent', 'no');
    atom.config.set('welcome.showOnStartup', false);

    // tool-bar
    atom.config.set('tool-bar.iconSize', '16px');

    // terminal
    atom.config.set('platformio-ide-terminal.toggles.autoClose', true);
  },

  initSubcriptions() {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'north-editor:toggle': () => this.toggle(),
      'north-editor:ipython-terminal': () => this.ipythonTerminal(),
      'north-editor:install-requirements': () => this.installRequirements(),
      'north-editor:open-simulator': () => this.openSimulator(),
      'north-editor:new-project': () => this.openNewProject(),
      'north-editor:close-new-project': () => this.closeNewProject(),
      'north-editor:run-current-python-file': () => this.runCurrentPythonFile(),
      'north-editor:run-main-python-file': () => this.runMainPythonFile(),
    }));
  },

  initMenu() {
    const menu = atom.menu.template;

    // add Run menu before Help
    const helpIndex = menu.findIndex(item => item.label === '&Help');
    menu.splice(helpIndex, 0, runMenu);

    // add new project item
    const fileMenu = menu[0].submenu;
    const newFileIndex = fileMenu.findIndex(item => item.label === '&New File');
    fileMenu.splice(newFileIndex + 1, 0, newProjectMenu);

    // refresh menu
    atom.menu.update();
  },

  // this is called from `consumeToolbar`
  initToolbar() {
    toolbarItems.forEach(item => {
      if(item.type == 'spacer') {
        this.toolbar.addSpacer();
      } else {
        this.toolbar.addButton(item);
      }
    })
  },

  //
  // Services
  //

  consumePlatformioIDETerminal(terminal) {
    this.terminal = terminal;
  },

  consumeToolbar(getToolbar) {
    this.toolbar = getToolbar('north-editor-package');
    this.initToolbar();
  },

  //
  // Helpers
  //

  findCurrentFilepath() {
    const pane = atom.workspace.getActivePaneItem();
    if(!pane || !pane.buffer || !pane.buffer.file) return;
    return pane.buffer.file.path;
  },

  findCurrentProjectPath() {
    const projectPaths = atom.project.getPaths();
    const currentPath = this.findCurrentFilepath();
    for(var i = 0; i < projectPaths.length; i++) {
      var project = projectPaths[i];
      if(currentPath.startsWith(project)) return project;
    }
  },

  //
  // Commands
  //

  ipythonTerminal() {
    this.terminal.run(['ipython', 'exit']);
  },

  installRequirements() {
    this.terminal.run(['pip install -r requirements.txt']);
  },

  openSimulator() {
    const basePath = path.dirname(app.getAppPath());
    const simulatorPath = path.resolve(basePath, atom.config.get('north-editor-package.n9SimulatorPath'));
    childProcess.exec('explorer.exe ' + simulatorPath);
  },

  openNewProject() {
    if(!this.newProjectView) this.newProjectView = new NewProjectView(this);
    this.newProjectView.open();
  },

  closeNewProject() {
    if(!this.newProjectView) return;
    this.newProjectView.close();
  },

  runCurrentPythonFile() {
    const filePath = this.findCurrentFilepath();
    const python = atom.config.get('north-editor-package.pythonPath');
    this.terminal.run([python + ' ' + filePath]);
  },

  runMainPythonFile() {
    const currentProject = this.findCurrentProjectPath();
    const mainPythonFile = atom.config.get('north-editor-package.mainPythonFilename');
    const python = atom.config.get('north-editor-package.pythonPath');
    const mainPath = path.join(currentProject, mainPythonFile);
    if(!fs.existsSync(mainPath)) throw `Cannot find main python file: ${mainPath}`;

    this.terminal.run([python + ' ' + mainPath]);
  }

};
