'use strict';

const os = require('os');
const fs = require('fs');
const electron = require('electron');
const shell = electron.shell;
const markbot = electron.remote.require('./markbot');
const listener = electron.ipcRenderer;
const classify = require('../../app/classify');
const successMessages = require('./success-messages.json');
const robotBeeps = require('./robot-beeps.json');
const $body = document.querySelector('body');
const $dropbox = document.getElementById('dropbox');
const $checksWrapper = document.getElementById('checks');
const $messagesWrapper = document.getElementById('message-wrapper');
const $checks = document.getElementById('checks-container');
const $checksLoader = document.getElementById('checks-loader');
const $messages = document.getElementById('messages');
const $messagesPositive = document.getElementById('messages-positive');
const $messagesLoader = document.getElementById('messages-loader');
const $messagesLoaderLabel = document.querySelector('.messages-loader-label');
const $messageHeader = document.getElementById('message-header');
const $robotLogo = document.querySelector('.robot-logo');
const $messageHeading = document.querySelector('h2.no-errors');
const $signin = document.getElementById('sign-in');
// const $failure = document.getElementById('failure');
const $submit = document.getElementById('submit');
const $allGoodCheck = document.getElementById('all-good-check');
const $messageCanvas = document.querySelector('.with-canvas-message');
const $messageNoCanvas = document.querySelector('.no-canvas-message');

// TOOLBAR
const $openEditorBtn = document.getElementById('open-editor');
const $openBrowserBtn = document.getElementById('open-browser');
const $openRepoBtn = document.getElementById('open-repo');
const $createIssueBtn = document.getElementById('create-issue');
const $statusBar = document.getElementById('status-bar');
const $refreshBtn = document.getElementById('refresh-btn');
const $repoName = document.getElementById('folder');
const $canvasBtn = document.getElementById('submit-btn');
const $canvasBtnText = $canvasBtn.querySelector('#button-text');
const $statusBarRed = document.getElementById('status-bar-red');
const $statusBarYellow = document.getElementById('status-bar-yellow');
const $statusBarGreen = document.getElementById('status-bar-green');
const $statusBarRedText = $statusBarRed.querySelector('.toolbar-status-text');
const $statusBarYellowText = $statusBarYellow.querySelector('.toolbar-status-text');
const $statusBarGreenText = $statusBarGreen.querySelector('.toolbar-status-text');

let groups = {};
let checks = {};
let fullPath = false;
let isMarkbotDoneYet;

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

const displayDiffWindow = function (imgs, width) {
  markbot.showDifferWindow(imgs, width);
};

const buildImageDiffErrorMessage = function (err, li) {
  var
    message = document.createElement('span'),
    diff = document.createElement('span'),
    div = document.createElement('div'),
    imgWrap = document.createElement('div'),
    img = document.createElement('img'),
    expectedPercent = Math.ceil(err.diff.expectedPercent * 100),
    percent = Math.ceil(err.diff.percent * 100)
  ;

  div.classList.add('diff-wrap');
  message.textContent = err.message;
  diff.innerHTML = `${percent}% difference<br>Expecting less than ${expectedPercent}%`;
  imgWrap.classList.add('diff-img-wrap');
  img.src = `${err.images.diff}?${Date.now()}`;

  imgWrap.appendChild(img);
  div.appendChild(imgWrap);
  div.appendChild(diff);

  li.appendChild(message);
  li.appendChild(div);

  div.addEventListener('click', function () {
    displayDiffWindow(JSON.stringify(err.images), err.width);
  });
};

const buildTableErrorMessage = function (err, li) {
  let table = document.createElement('table');
  let caption = document.createElement('caption');
  let thead = document.createElement('thead');
  let tbody = document.createElement('tbody');
  let theadRow = document.createElement('tr');

  caption.innerHTML = err.message;
  table.appendChild(caption);

  err.headings.forEach(function (item) {
    let th = document.createElement('th');

    th.innerHTML = item;
    th.setAttribute('scope', 'col');
    theadRow.appendChild(th);
  });

  err.rows.forEach(function (item) {
    let tr = document.createElement('tr');
    let th = document.createElement('th');

    th.innerHTML = item.title;
    th.setAttribute('scope', 'row');
    tr.appendChild(th);

    if (item.highlight) tr.classList.add('highlight');

    item.data.forEach(function (data) {
      let td = document.createElement('td');

      td.innerHTML = prepareErrorText(data);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  thead.appendChild(theadRow);
  table.appendChild(thead);
  table.appendChild(tbody);
  li.appendChild(table);
};

const buildErrorMessageFromObject = function (err, li) {
  switch (err.type) {
    case 'code-diff':
      buildCodeDiffErrorMessage(err, li);
      break;
    case 'image-diff':
      buildImageDiffErrorMessage(err, li);
      break;
    case 'table':
      buildTableErrorMessage(err, li);
      break;
  }
};

const escapeHTML = function (err) {
  if (typeof err !== 'string') return err;

  return err.replace(/[&<>]/g, function (tag) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;'
    }[tag];
  });
};

const transformCodeBlocks = function (err) {
  if (typeof err !== 'string') return err;

  while (err.match(/`/)) {
    err = err.replace(/`/, '<samp>');
    err = err.replace(/`/, '</samp>');
  }

  return err;
};

const transformLinks = function (err) {
  if (typeof err !== 'string') return err;

  if (err.match(/@@/)) {
    err = err.replace(/@@(.+?)@@/g, '<a href="$1">$1</a>');
  }

  return err;
};

const transformStrong = function (err) {
  if (typeof err !== 'string') return err;

  if (err.match(/\*\*/)) {
    err = err.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  return err;
};

const transformMark = function (err) {
  if (typeof err !== 'string') return err;

  if (err.match(/\*\*\*/)) {
    err = err.replace(/\*\*\*(.+?)\*\*\*/g, '<mark>$1</mark>');
  }

  return err;
};

const prepareErrorText = function (err) {
  return transformCodeBlocks(transformStrong(transformMark(transformLinks(escapeHTML(err)))));
};

const displayErrors = function (group, label, linkId, errors, status, isMessages) {
  const $errorGroup = document.createElement('div');
  const $groupHead = document.createElement('h2');
  const $messageList = document.createElement('ul');

  $groupHead.textContent = groups[group].label + ' — ' + label;
  $groupHead.id = linkId;

  errors.forEach(function (err) {
    const li = document.createElement('li');

    if (typeof err == 'object') {
      buildErrorMessageFromObject(err, li);

      if (err.status) status = err.status;
    } else {
      li.innerHTML = prepareErrorText(err);
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

  if (isMessages) {
    $messagesPositive.appendChild($errorGroup);
    $messagesPositive.dataset.state = 'visible';
  } else {
    $messages.dataset.state = 'visible';
    $messages.appendChild($errorGroup);
  }
};

const reset = function () {
  clearInterval(isMarkbotDoneYet);
  $messages.innerHTML = '';
  $messagesPositive.innerHTML = '';
  $checks.innerHTML = '';
  $checksLoader.dataset.state = 'visible';
  $messagesLoader.dataset.state = 'visible';
  $messagesLoaderLabel.innerHTML = robotBeeps[Math.floor(Math.random() * robotBeeps.length)] + '…';
  $messages.dataset.state = 'hidden';
  $messagesPositive.dataset.state = 'hidden';
  $messageHeader.dataset.state = 'computing';
  // $failure.dataset.state = 'hidden';
  $submit.dataset.state = 'hidden';
  $allGoodCheck.style.animationName = 'none';
  $messageNoCanvas.removeAttribute('hidden');
  $messageCanvas.setAttribute('hidden', true);

  $canvasBtn.dataset.state = '';
  $canvasBtn.setAttribute('disabled', true);
  $canvasBtnText.innerHTML = 'Submit';
  $canvasBtn.dataset.canSubmit = false;

  $dropbox.dataset.state = 'visible';
  $messagesWrapper.dataset.state = 'hidden';
  $checksWrapper.dataset.state = 'hidden';
  $statusBar.setAttribute('disabled', true);
  $refreshBtn.setAttribute('disabled', true);
  $refreshBtn.setAttribute('data-state', '');
  $openEditorBtn.setAttribute('disabled', true);
  $openBrowserBtn.setAttribute('disabled', true);
  $openRepoBtn.setAttribute('disabled', true);
  $createIssueBtn.setAttribute('disabled', true);
  $repoName.querySelector('.icon-label').innerHTML = '—';
  $repoName.setAttribute('disabled', true);

  $statusBarRed.setAttribute('hidden', true);
  $statusBarYellow.setAttribute('hidden', true);
  $statusBarGreen.setAttribute('hidden', true);
  $statusBarRedText.innerHTML = '—';
  $statusBarYellowText.innerHTML = '—';
  $statusBarGreenText.innerHTML = '—';

  groups = {};
  checks = {};
  console.groupEnd();
  console.group();
};

const refresh = function () {
  if (fullPath && !isRunning()) {
    reset();
    startChecks();
    $dropbox.dataset.state = 'hidden';
    $messagesWrapper.dataset.state = 'visible';
    $checksWrapper.dataset.state = 'visible';
    $statusBar.removeAttribute('disabled');
    $refreshBtn.removeAttribute('disabled');
    $refreshBtn.setAttribute('data-state', 'computing');
    $openEditorBtn.removeAttribute('disabled');
    $openBrowserBtn.removeAttribute('disabled');
    $openRepoBtn.removeAttribute('disabled');
    $createIssueBtn.removeAttribute('disabled');
  }
};

const triggerDoneState = function () {
  if (isRunning()) return;

  clearInterval(isMarkbotDoneYet);
  $messagesLoader.dataset.state = 'hidden';
  $refreshBtn.setAttribute('data-state', '');

  if (hasErrors()) {
     $messageHeader.dataset.state = 'errors';
  } else {
    $messageHeader.dataset.state = 'no-errors';
    $messageHeading.innerHTML = successMessages[Math.floor(Math.random() * successMessages.length)] + '!';
    $submit.dataset.state = 'visible';
    $messages.dataset.state = 'hidden';
    $canvasBtn.removeAttribute('disabled');
  }
};

const isRunning = function () {
  const allGroups = document.querySelectorAll('#checks ul');

  for(let group of allGroups) {
    let aTags;

    if (group.innerHTML.trim() == '') return true;

    aTags = group.querySelectorAll('li a');

    for (let a of aTags) {
      if (!a.dataset.status || ['computing'].indexOf(a.dataset.status) >= 0) return true;
    }
  };

  return false;
};

const hasErrors = function () {
  const allGroups = document.querySelectorAll('#checks ul');

  for(let group of allGroups) {
    let aTags = group.querySelectorAll('li a');

    for (let a of aTags) {
      if (['bypassed', 'failed'].indexOf(a.dataset.status) >= 0) return true;
    }
  };

  return false;
};

const startChecks = function () {
  console.log(fullPath);
  markbot.newDebugGroup(fullPath);
  markbot.onFileDropped(fullPath);
  isMarkbotDoneYet = setInterval(triggerDoneState, 3000);
};

const fileDropped = function (path) {
  if (localStorage.getItem('github-username')) {
    reset();
    fullPath = path;
    startChecks();
    $dropbox.dataset.state = 'hidden';
    $messagesWrapper.dataset.state = 'visible';
    $checksWrapper.dataset.state = 'visible';
    $statusBar.removeAttribute('disabled');
    $refreshBtn.removeAttribute('disabled');
    $refreshBtn.setAttribute('data-state', 'computing');
    $openEditorBtn.removeAttribute('disabled');
    $openBrowserBtn.removeAttribute('disabled');
    $openRepoBtn.removeAttribute('disabled');
    $createIssueBtn.removeAttribute('disabled');
  }
};

const statusBarUpdate = function () {
  const allGroups = document.querySelectorAll('#checks ul');
  let redItems = 0;
  let yellowItems = 0;
  let greenItems = 0;

  for(let group of allGroups) {
    let aTags = group.querySelectorAll('li a');

    for (let a of aTags) {
      if (['succeeded'].indexOf(a.dataset.status) >= 0) {
        greenItems++;
        continue;
      }

      if (['failed'].indexOf(a.dataset.status) >= 0) {
        redItems++;
        continue;
      }

      yellowItems++;
    }
  };

  if (redItems > 0) {
    $statusBarRed.removeAttribute('hidden');
    $statusBarRedText.innerHTML = redItems;
  } else {
    $statusBarRed.setAttribute('hidden', true);
    $statusBarRedText.innerHTML = '—';
  }

  if (yellowItems > 0) {
    $statusBarYellow.removeAttribute('hidden');
    $statusBarYellowText.innerHTML = yellowItems;
  } else {
    $statusBarYellow.setAttribute('hidden', true);
    $statusBarYellowText.innerHTML = '—';
  }

  if (greenItems > 0) {
    $statusBarGreen.removeAttribute('hidden');
    $statusBarGreenText.innerHTML = greenItems;
  } else {
    $statusBarGreen.setAttribute('hidden', true);
    $statusBarGreenText.innerHTML = '—';
  }

  return false;
}

$body.classList.add(`os-${os.platform()}`);

if (os.platform() == 'darwin') {
  if (parseInt(os.release().split('.')[0]) >= 14) {
    $body.classList.add('macosx-gte-1010');
  } else {
    $body.classList.add('macosx-lt-1010');
  }
}

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

  if (!fs.statSync(e.dataTransfer.files[0].path).isDirectory()) {
    alert('Drop a folder onto Markbot instead of a single file');
    return false;
  }

  fileDropped(e.dataTransfer.files[0].path);

  return false;
};

document.getElementById('username-form').addEventListener('submit', function (e) {
  e.preventDefault();
  localStorage.setItem('github-username', document.getElementById('username').value);
  markbot.enableSignOut(localStorage.getItem('github-username'));
  $signin.dataset.state = 'hidden';
  $dropbox.dataset.state = 'visible';
});

document.getElementById('submit-btn').addEventListener('click', function (e) {
  e.preventDefault();

  if (!hasErrors() && !isRunning()) {
    $canvasBtn.dataset.state = 'processing';
    $canvasBtnText.innerHTML = 'Submitting…';

    markbot.submitToCanvas(localStorage.getItem('github-username'), function (err, data) {
      if (!err && data.code == 200) {
        $canvasBtn.dataset.state = 'done';
        $canvasBtnText.innerHTML = 'Submitted';
        $allGoodCheck.style.animationName = 'bounce-check';
      } else {
        $canvasBtn.dataset.state = '';
        $canvasBtnText.innerHTML = 'Submit';
        $allGoodCheck.style.animationName = 'none';
        if (data.message) alert(data.message);
      }
    });
  }
});

document.addEventListener('click', function (e) {
  if (e.target.matches('#messages a') || e.target.matches('#messages-positive a')) {
    e.preventDefault();
    shell.openExternal(e.target.href);
  }
});

window.addEventListener('will-navigate', function (e) {
  e.preventDefault();
});

$repoName.addEventListener('click', function (e) {
  e.preventDefault();
  markbot.revealFolder();
});

listener.on('app:file-missing', function (event) {
  reset();
});

listener.on('app:file-exists', function (event, repo) {
  $repoName.querySelector('.icon-label').innerHTML = repo;
  $repoName.removeAttribute('disabled');
});

listener.on('app:with-canvas', function (event) {
  $canvasBtn.dataset.canSubmit = true;
  $messageNoCanvas.setAttribute('hidden', true);
  $messageCanvas.removeAttribute('hidden');
});

listener.on('app:all-done', function (event) {
  triggerDoneState();
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

  $checksLoader.dataset.state = 'hidden';
  $checks.appendChild($groupHead);
  $checks.appendChild(groups[id].elem);
});

listener.on('check-group:item-new', function (event, group, id, label) {
  var
    checkLi = null,
    checkId = group + id,
    checkClass = classify(checkId)
  ;

  if (!checks[checkId]) {
    checks[checkId] = document.createElement('a');
    checks[checkId].href = '#' + checkClass;
    checks[checkId].dataset.id = checkClass;
    checkLi = document.createElement('li');
    checkLi.appendChild(checks[checkId]);
    groups[group].elem.appendChild(checkLi);
  }

  checks[checkId].textContent = label;
  statusBarUpdate();
});

listener.on('check-group:item-computing', function (event, group, id) {
  var checkId = group + id;

  checks[checkId].dataset.status = 'computing';
  statusBarUpdate();
});

listener.on('check-group:item-bypass', function (event, group, id, label, errors) {
  var checkId = group + id;

  checks[checkId].dataset.status = 'bypassed';
  displayErrors(group, label, checks[checkId].dataset.id, errors, 'bypassed');
  statusBarUpdate();
});

listener.on('check-group:item-complete', function (event, group, id, label, errors, skip, messages) {
  var checkId = group + id;

  if (errors && errors.length > 0) {
    checks[checkId].dataset.status = 'failed';
    displayErrors(group, label, checks[checkId].dataset.id, errors, skip);
  } else {
    checks[checkId].dataset.status = 'succeeded';
  }

  if (messages && messages.length > 0) displayErrors(group, label, id, messages, '', true);
  statusBarUpdate();
})

listener.on('app:open-repo', function (event, path) {
  reset();
  fullPath = path;
  startChecks();
  $dropbox.dataset.state = 'hidden';
  $messagesWrapper.dataset.state = 'visible';
  $checksWrapper.dataset.state = 'visible';
  $statusBar.removeAttribute('disabled');
  $refreshBtn.removeAttribute('disabled');
  $refreshBtn.setAttribute('data-state', 'computing');
  $openEditorBtn.removeAttribute('disabled');
  $openBrowserBtn.removeAttribute('disabled');
  $openRepoBtn.removeAttribute('disabled');
  $createIssueBtn.removeAttribute('disabled');
});

listener.on('app:re-run', function (event) {
  if (fullPath && !isRunning()) {
    reset();
    startChecks();
    $dropbox.dataset.state = 'hidden';
    $messagesWrapper.dataset.state = 'visible';
    $checksWrapper.dataset.state = 'visible';
    $statusBar.removeAttribute('disabled');
    $refreshBtn.removeAttribute('disabled');
    $refreshBtn.setAttribute('data-state', 'computing');
    $openEditorBtn.removeAttribute('disabled');
    $openBrowserBtn.removeAttribute('disabled');
    $openRepoBtn.removeAttribute('disabled');
    $createIssueBtn.removeAttribute('disabled');
  }
});

$robotLogo.addEventListener('click', () => refresh());
$refreshBtn.addEventListener('click', () => refresh());
$openBrowserBtn.addEventListener('click', () => markbot.openBrowserToServer());
$createIssueBtn.addEventListener('click', () => markbot.createGitHubIssue());
$openRepoBtn.addEventListener('click', () => markbot.openGitHubRepo());
$openEditorBtn.addEventListener('click', () => markbot.openInCodeEditor());

listener.on('app:sign-out', function (event) {
  localStorage.clear();
  markbot.disableSignOut();
  markbot.disableFolderMenuFeatures();
  markbot.disableWebServer();
  window.location.reload();
});

listener.on('app:file-dropped', function (event, path) {
  fileDropped(path);
});

listener.on('debug', function (event, ...args) {
  markbot.debug(args);
  console.log(...args);
});

listener.on('alert', function (event, message) {
  alert(message);
});

if (localStorage.getItem('github-username')) {
  $signin.dataset.state = 'hidden';
  $dropbox.dataset.state = 'visible';
  markbot.enableSignOut(localStorage.getItem('github-username'));
}

listener.on('app:blur', function (e) {
  $body.classList.add('window-blurred');
});

listener.on('app:focus', function (e) {
  $body.classList.remove('window-blurred');
});
