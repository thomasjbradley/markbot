'use strict';

const createMessageGroup = function () {
  return {
    errors: [],
    warnings: [],
    messages: [],
  };
};

const bindMessageGroup = function (check, allMessages) {
  let messageAfter = (check.customMessage) ? ` — __${check.customMessage}__` : '';
  let messageBefore = '';

  if (check.lines) {
    let plural = (check.lines.length > 1) ? 's' : '';

    messageBefore = `Line${plural} ${check.lines.join(', ')}: `;
  }

  switch (check.type) {
    case 'warning':
      allMessages.warnings.push(`${messageBefore}${check.message}${messageAfter}`);
      break;
    case 'message':
      allMessages.messages.push(`${messageBefore}${check.message}${messageAfter}`);
      break;
    default:
      allMessages.errors.push(`${messageBefore}${check.message}${messageAfter}`);
  }

  return allMessages;
};

module.exports = {
  new: createMessageGroup,
  bind: bindMessageGroup,
};
