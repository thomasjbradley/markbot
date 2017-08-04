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
const $messagesWarning = document.getElementById('messages-warning');
const $messagesLoader = document.getElementById('messages-loader');
const $messagesLoaderLabel = document.querySelector('.messages-loader-label');
const $messageHeader = document.getElementById('message-header');
const $robotLogo = document.querySelector('.robot-logo');
const $messageHeading = document.querySelector('h2.no-errors');
const $signin = document.getElementById('sign-in');
// const $failure = document.getElementById('failure');
const $submit = document.getElementById('submit');
const $allGoodCheck = document.getElementById('all-good-check');
const $messageCanvas = document.querySelector('.success-fail-message.with-canvas');
const $messageNoCanvas = document.querySelector('.success-fail-message.no-canvas');

// TOOLBAR
const $toolbar = document.getElementById('toolbar');
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

let ERROR_MESSAGE_TYPE = {
  DEFAULT: false,
  POSITIVE: 'POSITIVE',
  WARNING: 'WARNING',
};

let ERROR_MESSAGE_STATUS = {
  DEFAULT: false,
  BYPASS: 'BYPASS',
  SKIP: 'SKIP',
};

const buildCodeDiffErrorMessage = function (err, li) {
  const message = document.createElement('span');
  const code = document.createElement('section');
  const sawDiv = document.createElement('div');
  const expectedDiv = document.createElement('div');
  const sawHead = document.createElement('strong');
  const expectedHead = document.createElement('strong');
  const sawPre = document.createElement('pre');
  const expectedPre = document.createElement('pre');

  message.textContent = err.message;

  code.classList.add('error-code-block');
  sawDiv.classList.add('error-sample-saw');
  expectedDiv.classList.add('error-sample-expected');
  sawHead.textContent = 'Saw in your code:';
  expectedHead.textContent = 'Expected to see:';
  sawHead.classList.add('error-sample-head');
  expectedHead.classList.add('error-sample-head');

  err.code.saw.forEach(function (line, i) {
    let tag = document.createElement('code');

    tag.textContent = line;

    if (i == err.code.line) tag.classList.add('error-sample-line');

    sawPre.innerHTML += tag.outerHTML;
  });

  err.code.expected.forEach(function (line, i) {
    let tag = document.createElement('code');

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
  let message = document.createElement('span');
  let diff = document.createElement('span');
  let div = document.createElement('div');
  let imgWrap = document.createElement('div');
  let img = document.createElement('img');
  let expectedPercent = Math.ceil(err.diff.expectedPercent * 100);
  let percent = Math.ceil(err.diff.percent * 100);

  div.classList.add('diff-wrap');
  div.setAttribute('aria-role', 'button');
  div.setAttribute('tabindex', 0);
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

  div.addEventListener('keyup', function (e) {
    if (e.code == 'Enter' || e.code == 'Space') displayDiffWindow(JSON.stringify(err.images), err.width);
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

const displayErrors = function (group, label, linkId, errors, status, messageType) {
  const $errorGroup = document.createElement('div');
  const $groupHead = document.createElement('h2');
  const $groupHeadText = document.createElement('span');
  const $messageList = document.createElement('ul');

  $groupHead.id = linkId;
  $groupHead.setAttribute('tabindex', 0);
  $groupHeadText.textContent = groups[group].label + ' — ' + label;
  $groupHead.appendChild($groupHeadText);

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
    case ERROR_MESSAGE_STATUS.BYPASS:
      $errorGroup.dataset.state = 'bypassed';
      break;
    case ERROR_MESSAGE_STATUS.SKIP:
      let skipLi = document.createElement('li');
      skipLi.textContent = 'More checks skipped because of the above errors';
      skipLi.dataset.state = 'skipped';
      $messageList.appendChild(skipLi)
      break;
    default:
      break;
  }

  $errorGroup.appendChild($groupHead);
  $errorGroup.appendChild($messageList);

  switch (messageType) {
    case ERROR_MESSAGE_TYPE.POSITIVE:
      $messagesPositive.appendChild($errorGroup);
      $messagesPositive.dataset.state = 'visible';
      break;
    case ERROR_MESSAGE_TYPE.WARNING:
      $messagesWarning.appendChild($errorGroup);
      $messagesWarning.dataset.state = 'visible';
      break;
    default:
      $messages.dataset.state = 'visible';
      $messages.appendChild($errorGroup);
  }
};

const reset = function () {
  clearInterval(isMarkbotDoneYet);
  $messages.innerHTML = '';
  $messagesPositive.innerHTML = '';
  $messagesWarning.innerHTML = '';
  $checks.innerHTML = '';
  $checksLoader.dataset.state = 'visible';
  $messagesLoader.dataset.state = 'visible';
  $messagesLoaderLabel.innerHTML = robotBeeps[Math.floor(Math.random() * robotBeeps.length)] + '…';
  $messages.dataset.state = 'hidden';
  $messagesPositive.dataset.state = 'hidden';
  $messagesWarning.dataset.state = 'hidden';
  $messageHeader.dataset.state = 'computing';
  $robotLogo.setAttribute('aria-label', 'Computing…');
  // $failure.dataset.state = 'hidden';
  $submit.dataset.state = 'hidden';
  $allGoodCheck.style.animationName = 'none';
  $messageNoCanvas.removeAttribute('hidden');
  $messageCanvas.setAttribute('hidden', true);
  [].map.call(document.querySelectorAll('.success-fail-message-warning'), (elem) => elem.setAttribute('hidden', true));

  $canvasBtn.dataset.state = '';
  $canvasBtn.setAttribute('disabled', true);
  $canvasBtnText.innerHTML = 'Submit';
  $canvasBtn.dataset.canSubmit = false;
  $canvasBtn.setAttribute('tabindex', -1);
  markbot.disableSubmitAssignment();

  $dropbox.dataset.state = 'visible';
  $messagesWrapper.dataset.state = 'hidden';
  $checksWrapper.dataset.state = 'hidden';
  $statusBar.setAttribute('disabled', true);
  $refreshBtn.setAttribute('disabled', true);
  $refreshBtn.setAttribute('aria-label', 'Refresh');
  $refreshBtn.setAttribute('title', 'Refresh');
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
  if (fullPath && !isRunning()) fileDropped(fullPath);
};

const triggerDoneState = function () {
  if (isRunning()) return;

  clearInterval(isMarkbotDoneYet);
  $messagesLoader.dataset.state = 'hidden';
  $refreshBtn.setAttribute('data-state', '');
  $refreshBtn.setAttribute('aria-label', 'Refresh');
  $refreshBtn.setAttribute('title', 'Refresh');

  if (hasErrors()) {
    $messageHeader.dataset.state = 'errors';
    $robotLogo.setAttribute('aria-label', 'Some checks failed.');
  } else {
    $messageHeader.dataset.state = 'no-errors';
    $robotLogo.setAttribute('aria-label', 'All clear!');
    $submit.dataset.state = 'visible';
    $messages.dataset.state = 'hidden';
    $canvasBtn.removeAttribute('disabled');

    if (hasWarnings()) {
      $messageHeading.innerHTML = successMessages[Math.floor(Math.random() * successMessages.length)] + '-ish!';
      [].map.call(document.querySelector('.success-fail-message:not([hidden])').querySelectorAll('.success-fail-message-warning'), (elem) => elem.removeAttribute('hidden'));
    } else {
      $messageHeading.innerHTML = successMessages[Math.floor(Math.random() * successMessages.length)] + '!';
    }

    if ($canvasBtn.dataset.canSubmit === 'true') markbot.enableSubmitAssignment();
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

const hasWarnings = function () {
  const allGroups = document.querySelectorAll('#checks ul');

  for(let group of allGroups) {
    let aTags = group.querySelectorAll('li a');

    for (let a of aTags) {
      if (['warnings'].indexOf(a.dataset.status) >= 0) return true;
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
    $refreshBtn.setAttribute('aria-label', 'Computing…');
    $refreshBtn.setAttribute('title', 'Computing…');
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

      if (['warnings'].indexOf(a.dataset.status) >= 0) {
        yellowItems++;
        continue;
      }

      if (['failed'].indexOf(a.dataset.status) >= 0) {
        redItems++;
        continue;
      }
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

const submitAssignment = function (e) {
  if (e) e.preventDefault();

  if (!hasErrors() && !isRunning()) {
    $canvasBtn.dataset.state = 'processing';
    $canvasBtnText.innerHTML = 'Submitting…';
    markbot.disableSubmitAssignment();

    markbot.submitToCanvas(localStorage.getItem('github-username'), function (err, data) {
      if (!err && data.code == 200) {
        $canvasBtn.dataset.state = 'done';
        $canvasBtnText.innerHTML = 'Submitted';
        $allGoodCheck.style.animationName = 'bounce-check';
      } else {
        $canvasBtn.dataset.state = '';
        $canvasBtnText.innerHTML = 'Submit';
        $allGoodCheck.style.animationName = 'none';
        markbot.enableSubmitAssignment();
        if (data.message) alert(data.message);
      }
    });
  }
};

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

document.addEventListener('click', function (e) {
  if (e.target.matches('#messages a') || e.target.matches('#messages-positive a')) {
    e.preventDefault();
    shell.openExternal(e.target.href);
  }

  if (e.target.matches('#checks a')) {
    e.preventDefault();
    window.location.hash = e.target.getAttribute('href');
  }
});

window.addEventListener('will-navigate', function (e) {
  e.preventDefault();
});

$repoName.addEventListener('click', function (e) {
  e.preventDefault();
  markbot.revealFolder();
});

$robotLogo.addEventListener('click', () => refresh());
$refreshBtn.addEventListener('click', () => refresh());
$openBrowserBtn.addEventListener('click', () => markbot.openBrowserToServer());
$createIssueBtn.addEventListener('click', () => markbot.createGitHubIssue());
$openRepoBtn.addEventListener('click', () => markbot.openGitHubRepo());
$openEditorBtn.addEventListener('click', () => markbot.openInCodeEditor());
$canvasBtn.addEventListener('click', () => submitAssignment());

listener.on('app:file-missing', function (event) {
  reset();
});

listener.on('app:file-exists', function (event, repo) {
  $repoName.querySelector('.icon-label').innerHTML = repo;
  $repoName.removeAttribute('disabled');
});

listener.on('app:all-done', function (event) {
  triggerDoneState();
});

listener.on('check-group:new', function (event, id, label) {
  const $groupHead = document.createElement('h2');
  const $groupTitle = document.createElement('span');

  groups[id] = {
    label: label,
    elem: document.createElement('ul')
  };

  $groupTitle.classList.add('title-wrap');
  $groupTitle.textContent = label;

  $groupHead.setAttribute('tabindex', 0);
  $groupHead.id = id;
  $groupHead.appendChild($groupTitle);

  $checksLoader.dataset.state = 'hidden';
  $checks.appendChild($groupHead);
  $checks.appendChild(groups[id].elem);
});

listener.on('check-group:item-new', function (event, group, id, label) {
  let checkLi = null;
  let checkId = group + id;
  let checkClass = classify(checkId);
  let groupLabel = group;
  let $groupHeading = document.getElementById(group);

  if (!checks[checkId]) {
    checks[checkId] = document.createElement('a');
    checks[checkId].href = '#' + checkClass;
    checks[checkId].dataset.id = checkClass;
    checkLi = document.createElement('li');
    checkLi.appendChild(checks[checkId]);
    groups[group].elem.appendChild(checkLi);
  }

  if ($groupHeading) groupLabel = $groupHeading.textContent;

  checks[checkId].setAttribute('aria-label', `${groupLabel} — ${label}`);
  checks[checkId].textContent = label;
  statusBarUpdate();
});

listener.on('check-group:item-computing', function (event, group, id) {
  let checkId = group + id;

  checks[checkId].dataset.status = 'computing';
  statusBarUpdate();
});

listener.on('check-group:item-bypass', function (event, group, id, label, errors) {
  let checkId = group + id;

  checks[checkId].dataset.status = 'bypassed';
  checks[checkId].setAttribute('aria-label', checks[checkId].getAttribute('aria-label') + ' — Bypassed')
  displayErrors(group, label, checks[checkId].dataset.id, errors, ERROR_MESSAGE_STATUS.BYPASS);
  statusBarUpdate();
});

listener.on('check-group:item-complete', function (event, group, id, label, errors, skip, messages, warnings) {
  let checkId = group + id;

  if (errors && errors.length > 0) {
    checks[checkId].dataset.status = 'failed';
    checks[checkId].setAttribute('aria-label', checks[checkId].getAttribute('aria-label') + ' — Failed')
    displayErrors(group, label, checks[checkId].dataset.id, errors, skip);
  }

  if (warnings && warnings.length > 0) {
    checks[checkId].dataset.status = 'warnings';
    checks[checkId].setAttribute('aria-label', checks[checkId].getAttribute('aria-label') + ' — Has Warnings')
    displayErrors(group, label, checks[checkId].dataset.id, warnings, ERROR_MESSAGE_STATUS.DEFAULT, ERROR_MESSAGE_TYPE.WARNING);
  }

  if ((!errors || errors.length <= 0) && (!warnings || warnings.length <= 0)) {
    checks[checkId].dataset.status = 'succeeded';
    checks[checkId].setAttribute('aria-disabled', true);
    checks[checkId].setAttribute('tabindex', -1);
    checks[checkId].setAttribute('aria-label', checks[checkId].getAttribute('aria-label') + ' — Passed')

    if (messages && messages.length > 0)
      displayErrors(group, label, checks[checkId].dataset.id, messages, ERROR_MESSAGE_STATUS.DEFAULT, ERROR_MESSAGE_TYPE.POSITIVE);
  }

  statusBarUpdate();
})

listener.on('app:re-run', function (event) {
  refresh(fullPath);
});

listener.on('app:without-github', function (event) {
  $createIssueBtn.dataset.canBeEnabled = false;
  $createIssueBtn.setAttribute('tabindex', -1);
  $openRepoBtn.dataset.canBeEnabled = false;
  $openRepoBtn.setAttribute('tabindex', -1);
});

listener.on('app:with-github', function (event) {
  $createIssueBtn.dataset.canBeEnabled = true;
  $createIssueBtn.removeAttribute('tabindex');
  $openRepoBtn.dataset.canBeEnabled = true;
  $openRepoBtn.removeAttribute('tabindex');
});

listener.on('app:with-canvas', function (event) {
  $canvasBtn.dataset.canSubmit = true;
  $canvasBtn.removeAttribute('tabindex');
  $messageNoCanvas.setAttribute('hidden', true);
  $messageCanvas.removeAttribute('hidden');
  [].map.call(document.querySelectorAll('.success-fail-message-warning'), (elem) => elem.setAttribute('hidden', true));
});

listener.on('app:focus-toolbar', function (event) {
  $toolbar.focus();
});

listener.on('app:focus-checklist', function (event) {
  $checksWrapper.focus();
});

listener.on('app:focus-errorlist', function (event) {
  $messagesWrapper.focus();
});

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

listener.on('app:submit-assignment', function (event, path) {
  submitAssignment();
});

listener.on('debug', function (event, ...args) {
  markbot.debug(args);
  console.log(...args);
});

listener.on('alert', function (event, message) {
  alert(message);
});

listener.on('app:blur', function (e) {
  $body.classList.add('window-blurred');
});

listener.on('app:focus', function (e) {
  $body.classList.remove('window-blurred');
});

if (localStorage.getItem('github-username')) {
  $signin.dataset.state = 'hidden';
  $dropbox.dataset.state = 'visible';
  markbot.enableSignOut(localStorage.getItem('github-username'));
}
