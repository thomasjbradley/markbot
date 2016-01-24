'use strict';

const
  markbot = require('electron').remote.require('./markbot'),
  listener = require('electron').ipcRenderer
;

const successMessages = [
  'Booyakasha',
  'Way to go',
  'Super-duper',
  'Awesome',
  'Cowabunga',
  'Rad',
  'Amazeballs',
  'Sweet',
  'Cool',
  'Nice',
  'Fantastic',
  'Geronimo',
  'Whamo',
  'Superb',
  'Stupendous',
  'Mathmatical',
  'All clear'
];

var
  $body = document.querySelector('body'),
  $dropbox = document.getElementById('dropbox'),
  $checks = document.getElementById('checks'),
  $messages = document.getElementById('messages'),
  $messageHeader = document.getElementById('message-header'),
  $messageHeading = document.querySelector('h2.no-errors'),
  $repoName = document.getElementById('folder'),
  $signin = document.getElementById('sign-in'),
  $submit = document.getElementById('submit'),
  $canvasBtn = document.getElementById('submit-btn'),
  groups = {},
  checks = {},
  fullPath = false,
  hasErrors = false,
  checksCount = 0,
  checksCompleted = 0
;

const displayErrors = function (group, label, errors) {
  var
    $groupHead = document.createElement('h2'),
    $messageList = document.createElement('ul')
  ;

  hasErrors = true;
  $groupHead.textContent = groups[group].label + ' — ' + label;

  errors.forEach(function (err) {
    var li = document.createElement('li');
    li.textContent = err;
    $messageList.appendChild(li)
  });

  $messages.appendChild($groupHead);
  $messages.appendChild($messageList);
};

const displaySummary = function () {
  $messageHeader.dataset.state = 'computing';

  if (hasErrors && checksCompleted >= checksCount) {
    $messageHeader.dataset.state = 'errors';
  }

  if (!hasErrors && checksCompleted >= checksCount) {
    $messageHeader.dataset.state = 'no-errors';
    $messageHeading.innerHTML = successMessages[Math.floor(Math.random() * successMessages.length)] + '!';
    $submit.dataset.state = 'visible';
  }
};

const checkGroup = function (id, label, cb) {
  var
    $groupHead = document.createElement('h2'),
    $groupTitle = document.createElement('span')
  ;

  groups[id] = {
    label: label,
    elem: document.createElement('ul')
  };

  $groupTitle.classList.add('title-wrap');
  $groupTitle.textContent = label;

  $groupHead.appendChild($groupTitle);
  $checks.appendChild($groupHead);
  $checks.appendChild(groups[id].elem);

  cb();
};

const check = function (id, group, status, label, errors) {
  var
    checkLi = null,
    checkId = group + id
  ;

  if(status == 'start') checksCount++;
  if(status == 'end') checksCompleted++;

  if (!checks[checkId]) {
    checks[checkId] = document.createElement('span');
    checkLi = document.createElement('li');
    checkLi.appendChild(checks[checkId]);
    groups[group].elem.appendChild(checkLi);
  }

  if (errors && errors.length > 0) {
    checks[checkId].dataset.status = 'errors';
    displayErrors(group, label, errors);
  } else {
    checks[checkId].dataset.status = status;
  }

  checks[checkId].textContent = label;
  displaySummary();
};

const repo = function (err, name) {
  if (!err) $repoName.innerHTML = name;
};

const reset = function () {
  hasErrors = false;
  $messages.innerHTML = '';
  $checks.innerHTML = '';
  $messageHeader.dataset.state = 'computing';
  $submit.dataset.state = 'hidden';
  groups = {};
  checks = {};
};

const startChecks = function () {
  markbot.onFileDropped(fullPath, checkGroup, check, repo);
};

$body.ondragover = function (e) {
  e.stopImmediatePropagation();
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  return false;
};

$body.ondragleave = function (e) {
  e.stopImmediatePropagation();
  e.stopPropagation();
  e.preventDefault();
  return false;
};

$body.ondrop = function (e) {
  e.preventDefault();

  if (localStorage.getItem('github-username')) {
    reset();
    fullPath = e.dataTransfer.files[0].path;
    startChecks();
    $dropbox.dataset.state = 'hidden';
  }

  return false;
};

document.getElementById('username-form').addEventListener('submit', function (e) {
  e.preventDefault();
  localStorage.setItem('github-username', document.getElementById('username').value);
  $signin.dataset.state = 'hidden';
});

document.getElementById('submit-btn').addEventListener('click', function (e) {
  e.preventDefault();

  if (!hasErrors && checksCompleted >= checksCount) {
    $canvasBtn.dataset.state = 'processing';
    $canvasBtn.setAttribute('disabled', true);

    markbot.submitToCanvas(localStorage.getItem('github-username'), function (err, data) {
      if (!err) {
        $canvasBtn.dataset.state = 'done';
      } else {
        $canvasBtn.dataset.state = '';
        $canvasBtn.removeAttribute('disabled');
      }
    });
  }
});

listener.on('open-repo', function (event, path) {
  if (path) {
    reset();
    fullPath = path;
    startChecks();
    $dropbox.dataset.state = 'hidden';
  }
});

listener.on('re-run', function (event) {
  if (fullPath) {
    reset();
    startChecks();
    $dropbox.dataset.state = 'hidden';
  }
});

listener.on('sign-out', function (event) {
  localStorage.clear();
});

if (localStorage.getItem('github-username')) {
  $signin.dataset.state = 'hidden';
}
