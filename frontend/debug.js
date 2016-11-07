'use strict';

const
  electron = require('electron'),
  ipcRenderer = electron.ipcRenderer,
  shell = electron.shell
  ;

let
  messages = document.querySelector('#main'),
  group
  ;

const closeOldGroups = function () {
  var details = document.querySelectorAll('details');

  if (!details) return;

  [].forEach.call(details, function (elem) {
    elem.removeAttribute('open');
    elem.open = false;
  });
};

ipcRenderer.on('__markbot-debug', function (e, ...args) {
  let li = document.createElement('li');

  li.innerHTML = args.join(' ');

  if (typeof args[0] === 'string' && args[0].match(/^cheater/i)) {
    li.innerHTML = `<strong class="cheater">${li.textContent}</strong>`;
  }

  if (li.innerHTML.match(/@@/)) {
    li.innerHTML = li.innerHTML.replace(/@@(.+?)@@/g, '<a href="$1">$1</a>');
  }

  if (li.innerHTML.match(/`/)) {
    li.innerHTML = li.innerHTML.replace(/`(.+?)`/g, '<code>$1</code>');
  }

  group.appendChild(li);
});

ipcRenderer.on('__markbot-debug-group', function (e, label) {
  let details = document.createElement('details');
  let summary = document.createElement('summary');
  let li = document.createElement('li');

  closeOldGroups();

  li.innerHTML = `<em><a href="${label}">${label}</a></em>`;
  group = document.createElement('ul');
  summary.innerHTML = `<span>${label.match(/\/([^/]+)$/)[1]}</span>`;
  details.setAttribute('open', true);

  group.appendChild(li);
  details.appendChild(summary);
  details.appendChild(group);
  messages.appendChild(details);
});

document.addEventListener('click', function (e) {
  if (e.target.matches('a')) {
    e.preventDefault();
    shell.showItemInFolder(e.target.getAttribute('href'));
  }
});
