'use strict';

const createMessageGroup = function () {
  return {
    errors: [],
    warnings: [],
    messages: [],
  };
};

const bindMessageGroup = function (check, allMessages) {
  const messageAfter = (check.customMessage) ? ` — *${check.customMessage}*` : '';

  switch (check.type) {
    case 'warning':
      allMessages.warnings.push(`${check.message}${messageAfter}`);
      break;
    case 'message':
      allMessages.messages.push(`${check.message}${messageAfter}`);
      break;
    default:
      allMessages.errors.push(`${check.message}${messageAfter}`);
  }

  return allMessages;
};

module.exports = {
  new: createMessageGroup,
  bind: bindMessageGroup,
};
