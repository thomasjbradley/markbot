'use strict';

const createMessageGroup = function () {
  return {
    errors: [],
    warnings: [],
    messages: [],
  };
};

const bindMessageGroup = function (check, allMessages) {
  let messageBefore = '';
  let theMessage = (check.customMessage) ? check.customMessage : check.message;

  if (check.lines) {
    let plural = (check.lines.length > 1) ? 's' : '';

    messageBefore = `Line${plural} ${check.lines.join(', ')}: `;
  }

  switch (check.type) {
    case 'warning':
      allMessages.warnings.push(`${messageBefore}${theMessage}`);
      break;
    case 'message':
      allMessages.messages.push(`${messageBefore}${theMessage}`);
      break;
    default:
      allMessages.errors.push(`${messageBefore}${theMessage}`);
  }

  return allMessages;
};

module.exports = {
  new: createMessageGroup,
  bind: bindMessageGroup,
};
