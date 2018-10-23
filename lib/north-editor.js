'use babel';

import path from 'path';
import childProcess from 'child_process';
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

export default {

  subscriptions: null,

  config: {
    n9SimulatorPath: {
      title: "N9 Simulator Path",
      type: "string",
      default: "..\\..\\N9 Simulator\\N9 Simulator.exe"
    }
  },

  activate(state) {
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
    }));

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

  deactivate() {
    if(this.newProjectView) this.newProjectView.destroy();
    this.subscriptions.dispose();
  },

  consumePlatformioIDETerminal(terminal) {
    this.terminal = terminal;
    console.log('TERM:', terminal);
  },

  ipythonTerminal() {
    this.terminal.run(['ipython', 'exit']);
  },

  installRequirements() {
    this.terminal.run(['pip install -r requirements.txt', 'exit']);
  },

  openSimulator() {
    const basePath = path.dirname(app.getAppPath());
    const simulatorPath = path.resolve(basePath, atom.config.get('north-editor.n9SimulatorPath'));
    childProcess.exec('explorer.exe ' + simulatorPath);
  },

  openNewProject() {
    if(!this.newProjectView) this.newProjectView = new NewProjectView(this);
    this.newProjectView.open();
  },

  closeNewProject() {
    if(!this.newProjectView) return;
    this.newProjectView.close();
  }

};
