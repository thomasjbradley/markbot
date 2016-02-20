'use strict';

const
  markbot = require('electron').remote.require('./markbot'),
  listener = require('electron').ipcRenderer,
  shell = require('electron').shell,
  successMessages = require('./lib/success-messages.json'),
  $body = document.querySelector('body'),
  $dropbox = document.getElementById('dropbox'),
  $checks = document.getElementById('checks'),
  $messages = document.getElementById('messages'),
  $messageHeader = document.getElementById('message-header'),
  $robotLogo = document.querySelector('.robot-logo'),
  $messageHeading = document.querySelector('h2.no-errors'),
  $repoName = document.getElementById('folder'),
  $signin = document.getElementById('sign-in'),
  $submit = document.getElementById('submit'),
  $canvasBtn = document.getElementById('submit-btn')
;

var
  groups = {},
  checks = {},
  fullPath = false,
  hasErrors = false,
  checksCount = 0,
  checksCompleted = 0,
  checksRunning = false
;

const classify = function (str) {
  return str.replace(/[^a-z0-9\-]/ig, '-').replace(/\-+/g, '-').toLowerCase();
};

const buildCodeDiffErrorMessage = function (err, li) {
  var
    message = document.createElement('span'),
    code = document.createElement('section'),
    sawDiv = document.createElement('div'),
    expectedDiv = document.createElement('div'),
    sawHead = document.createElement('strong'),
    expectedHead = document.createElement('strong'),
    sawPre = document.createElement('pre'),
    expectedPre = document.createElement('pre')
  ;

  message.textContent = err.message;

  code.classList.add('error-code-block');
  sawDiv.classList.add('error-sample-saw');
  expectedDiv.classList.add('error-sample-expected');
  sawHead.textContent = 'Saw in your code:';
  expectedHead.textContent = 'Expected to see:';
  sawHead.classList.add('error-sample-head');
  expectedHead.classList.add('error-sample-head');

  err.code.saw.forEach(function (line, i) {
    var tag = document.createElement('code');
    tag.textContent = line;

    if (i == err.code.line) tag.classList.add('error-sample-line');

    sawPre.innerHTML += tag.outerHTML;
  });

  err.code.expected.forEach(function (line, i) {
    var tag = document.createElement('code');
    tag.textContent = line;

    if (i == err.code.line) tag.classList.add('error-sample-line');

    expectedPre.innerHTML += tag.outerHTML;
  });

  li.appendChild(message);

  sawDiv.appendChild(sawHead);
  sawDiv.appendChild(sawPre);
  expectedDiv.appendChild(expectedHead);
  expectedDiv.appendChild(expectedPre);

  code.appendChild(sawDiv);
  code.appendChild(expectedDiv);

  li.appendChild(code);
};

const buildImageDiffErrorMessage = function (err, li) {
  var
    message = document.createElement('span'),
    div = document.createElement('div'),
    inDiv = document.createElement('div'),
    img = document.createElement('img')
  ;

  message.textContent = err.message;
  div.classList.add('img-wrap');
  inDiv.classList.add('img-wrap-inner');
  img.src = err.image + '?' + Date.now();

  div.appendChild(img);
  div.appendChild(inDiv);
  li.appendChild(message);
  li.appendChild(div);
};

const buildErrorMessageFromObject = function (err, li) {
  switch (err.type) {
    case 'code-diff':
      buildCodeDiffErrorMessage(err, li);
      break;
    case 'image-diff':
      buildImageDiffErrorMessage(err, li);
      break;
  }
};

const displayErrors = function (group, label, linkId, errors, status) {
  const
    $errorGroup = document.createElement('div'),
    $groupHead = document.createElement('h2'),
    $messageList = document.createElement('ul')
  ;

  hasErrors = true;
  $groupHead.textContent = groups[group].label + ' — ' + label;
  $groupHead.id = linkId;

  errors.forEach(function (err) {
    const li = document.createElement('li');

    if (typeof err == 'object') {
      buildErrorMessageFromObject(err, li);

      if (err.status) status = err.status;
    } else {
      li.textContent = err;
    }

    $messageList.appendChild(li)
  });

  switch (status) {
    case 'bypassed':
      $errorGroup.dataset.state = 'bypassed';
      break;
    case 'skip':
      let skipLi = document.createElement('li');
      skipLi.textContent = 'More checks skipped because of the above errors';
      skipLi.dataset.state = 'skipped';
      $messageList.appendChild(skipLi)
      break;
  }

  $errorGroup.appendChild($groupHead);
  $errorGroup.appendChild($messageList);
  $messages.appendChild($errorGroup);
};

const displaySummary = function () {
  $messageHeader.dataset.state = 'computing';
  $submit.dataset.state = 'hidden';

  if (hasErrors && checksCompleted >= checksCount) {
    $messageHeader.dataset.state = 'errors';
    checksRunning = false;
  }

  if (!hasErrors && checksCompleted >= checksCount) {
    $messageHeader.dataset.state = 'no-errors';
    $messageHeading.innerHTML = successMessages[Math.floor(Math.random() * successMessages.length)] + '!';
    $submit.dataset.state = 'visible';
    checksRunning = false;
  }
};

const reset = function () {
  hasErrors = false;
  $messages.innerHTML = '';
  $checks.innerHTML = '';
  $messageHeader.dataset.state = 'computing';
  $submit.dataset.state = 'hidden';
  $canvasBtn.removeAttribute('disabled');
  $canvasBtn.dataset.state = '';
  groups = {};
  checks = {};
  checksCount = 0;
  checksCompleted = 0;
  checksRunning = false;
};

const startChecks = function () {
  checksRunning = true;
  markbot.onFileDropped(fullPath);
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
  markbot.enableSignOut(localStorage.getItem('github-username'));
  $signin.dataset.state = 'hidden';
});

document.getElementById('submit-btn').addEventListener('click', function (e) {
  e.preventDefault();

  if (!hasErrors && !checksRunning) {
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

document.addEventListener('keydown', function (e) {
  let
    macShortcut = (e.keyCode == 27 && e.metaKey),
    winShortcut = (e.keyCode == 27 && e.ctrlKey)
  ;

  if (macShortcut || winShortcut) markbot.showDevelopMenu();
});

document.addEventListener('click', function (e) {
  if (e.target.matches('.img-wrap-inner')) {
    let imgPath = e
      .target
      .parentNode
      .querySelector('img')
      .src
      .replace(/\?\d+$/, '')
      .replace(/file\:\/\//, '')
      ;
    shell.openItem(imgPath);
  }
});

$repoName.addEventListener('click', function (e) {
  e.preventDefault();
  markbot.revealFolder();
});

listener.on('app:file-missing', function (event) {
  reset();
  $dropbox.dataset.state = 'visible';
});

listener.on('app:file-exists', function (event, repo) {
  $repoName.innerHTML = repo;
});

listener.on('check-group:new', function (event, id, label) {
  const
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
});

listener.on('check-group:item-new', function (event, group, id, label) {
  var
    checkLi = null,
    checkId = group + id,
    checkClass = classify(checkId)
  ;

  checksCount++;

  if (!checks[checkId]) {
    checks[checkId] = document.createElement('a');
    checks[checkId].href = '#' + checkClass;
    checks[checkId].dataset.id = checkClass;
    checkLi = document.createElement('li');
    checkLi.appendChild(checks[checkId]);
    groups[group].elem.appendChild(checkLi);
  }

  checks[checkId].textContent = label;
  displaySummary();
});

listener.on('check-group:item-computing', function (event, group, id) {
  var checkId = group + id;

  checks[checkId].dataset.status = 'computing';

  displaySummary();
});

listener.on('check-group:item-bypass', function (event, group, id, label, errors) {
  var checkId = group + id;

  checksCompleted++;
  checks[checkId].dataset.status = 'bypassed';
  displayErrors(group, label, checks[checkId].dataset.id, errors, 'bypassed');

  displaySummary();
});

listener.on('check-group:item-complete', function (event, group, id, label, errors, skip) {
  var checkId = group + id;

  checksCompleted++;

  if (errors && errors.length > 0) {
    checks[checkId].dataset.status = 'failed';
    displayErrors(group, label, checks[checkId].dataset.id, errors, skip);
  } else {
    checks[checkId].dataset.status = 'succeeded';
  }

  displaySummary();
})

listener.on('app:open-repo', function (event, path) {
  reset();
  fullPath = path;
  startChecks();
  $dropbox.dataset.state = 'hidden';
});

listener.on('app:re-run', function (event) {
  if (fullPath && !checksRunning) {
    reset();
    startChecks();
    $dropbox.dataset.state = 'hidden';
  }
});

$robotLogo.addEventListener('click', function (e) {
  if (fullPath && !checksRunning) {
    reset();
    startChecks();
    $dropbox.dataset.state = 'hidden';
  }
});

listener.on('app:sign-out', function (event) {
  localStorage.clear();
  markbot.disableSignOut();
  markbot.disableFolderMenuFeatures();
  window.location.reload();
});

listener.on('app:force-reload', function (event) {
  markbot.disableFolderMenuFeatures();
  window.location.reload();
});

listener.on('debug', function (event, ...args) {
  console.log.apply(console, args);
});

if (localStorage.getItem('github-username')) {
  $signin.dataset.state = 'hidden';
  markbot.enableSignOut(localStorage.getItem('github-username'));
}
