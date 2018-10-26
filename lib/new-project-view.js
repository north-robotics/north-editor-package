'use babel';

import fs from 'fs-plus';
import path from 'path';
import { exec, execSync } from 'child_process';
import _ from 'underscore';
import { CompositeDisposable, TextEditor } from 'atom';

export default class NewProjectView {
  projectTypes = {
    'ada-core': {
      'name': 'Ada Core',
      'description': 'Ada Core is a high-level library for working with Chemistry',
      'repo': 'https://gitlab.com/ada-chem/ada_template',
      'openFiles': ['main.py', 'README.md'],
    },
    'north-c9': {
      'name': 'North C9',
      'description': 'Lower-level libraries for working with the North C9',
      'repo': 'https://gitlab.com/north-robotics/north_c9_skeleton',
      'openFiles': ['main.py', 'README.md'],
    },
  }

  constructor(controller) {
    this.controller = controller;

    this.init();

    this.element = document.createElement('div');
    this.editor = new TextEditor({ mini: true });

    this.disposables = new CompositeDisposable();
    this.disposables.add(atom.commands.add(this.element, {
      'core:confirm': () => this.close(),
      'core:cancel': () => this.close(),
    }));

    this.render();
  }

  init() {
    this.message = '';
    this.projectType = 'ada-core';
    const projectPaths = atom.project.getPaths();
    const basePath = projectPaths.length > 0 ? projectPaths[0] : process.env.USERPROFILE;
    this.projectPath = path.join(basePath, 'untitled');
  }

  template() {
    return `
      <style>
        #project-type-list li {
          cursor: pointer;
        }
        .footer-container {
          margin-top: 10px;
        }
        .loading {
          margin-top: 5px;
        }
        #browse {
          margin-bottom: 0.75em;
        }
        .directory-container, .footer-container {
          display: flex;
        }
        #directory, .footer-container .loading {
          flex-grow: 1;
        }
      </style>
      <div class="inset-panel">
        <div class="panel-heading title">
          <h3>New Project</h3>
        </div>
        <div class="panel-body padded">
          <h4>Directory</h4>
          <div class="directory-container">
            <div id="directory"></div>
            <button id="browse" class="btn icon icon-file-directory">Browse</button>
          </div>
          <h4>Type</h4>
          <div id="project-type-list" class='select-list'>
            <ol class='list-group'>
              ${_.map(this.projectTypes, (info, name) => `
                <li class='two-lines ${name == this.projectType ? 'selected' : ''}' data-name="${name}">
                  <div class='primary-line'>${info.name}</div>
                  <div class='secondary-line'>${info.description}</div>
                </li>
              `).join('\n')}
            </ol>
          </div>
          <div class="footer-container">
            <div class='loading'>
              <span id="message" class='loading-message'>${this.message}</span>
            </div>
            <div style="text-align: right">
              <button id="create" class="btn btn-success">Create</button>
              <button id="cancel" class="btn">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    var query = q => this.element.querySelector(q);
    var queryAll = q => _.toArray(this.element.querySelectorAll(q));
    query('#create').addEventListener('click', () => this.createProject())
    query('#cancel').addEventListener('click', () => this.close());
    query('#browse').addEventListener('click', () => this.onBrowseClick());
    queryAll('#project-type-list li').map(el => el.addEventListener('click', () => this.onProjectTypeSelect(el)));
  }

  onProjectTypeSelect(el) {
    const name = el.getAttribute('data-name');
    this.projectType = name;

    _.map(this.element.querySelectorAll('#project-type-list li.selected'), el => {
      el.classList.remove('selected');
    });

    el.classList.add('selected');
  }

  onBrowseClick() {
    atom.pickFolder(folder => {
      if(!folder || !folder.length) return;

      this.projectPath = folder[0];
      this.editor.setText(folder[0]);
    });
  }

  setMessage(message) {
    this.message = message;
    this.element.querySelector('#message').innerText = message;
  }

  createProject() {
    const projectInfo = this.projectTypes[this.projectType];
    const repoPath = projectInfo.repo;
    this.setMessage('Creating project...');
    setTimeout(() => {
      exec(`git clone "${repoPath}" "${this.projectPath}"`, (err, stdout, stderr) => {
        if(err) {
          atom.notifications.addError(err);
          return;
        }

        fs.removeSync(path.join(this.projectPath, '.git'));
        atom.project.setPaths([this.projectPath]);
        if(projectInfo.openFiles) projectInfo.openFiles.forEach(f => atom.workspace.open(f));
        this.controller.installRequirements();
        this.close();
      });
    }, 0);
  }

  destroy() {
    if(this.panel) this.panel.destroy();
    this.disposables.dispose();
  }

  open() {
    if(!this.panel) this.panel = atom.workspace.addModalPanel({ item: this, visible: false });
    this.init();
    this.render();
    this.panel.show();
  }

  close() {
    if(!this.panel.isVisible()) return;
    this.panel.hide();
  }

  render() {
    this.element.innerHTML = this.template();
    this.element.querySelector('#directory').appendChild(this.editor.element);
    this.editor.setText(this.projectPath);
    this.attachEvents();
  }
}
