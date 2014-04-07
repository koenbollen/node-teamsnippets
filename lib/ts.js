
var nodemailer = require('nodemailer');
var moment = require('moment');


exports.postupdate = function postupdate(records, options, callback) {

  if(isNaN(options.team)) {
    throw new Error('missing option field: team');
  }
  if(!options.from) {
    throw new Error('missing option field: from');
  }

  var text = exports.format_post(records)+'\n';

  var mail = {
    from: options.from,
    to: 'log+'+options.team+'@teamsnippets.com',
    subject: 'Team Snippets Update: ' + new Date(),
    text: text
  };

  if( options.dryrun ) {
    process.nextTick(function() {
      // Fake data (http://xkcd.com/221/):
      callback(null, { message: 'Message Queued',
        messageId: 'c681a6101e75e2777768d9432f2c21@localhost',
        statusHandler: { domain: null, _events: {}, _maxListeners: 10 } });
    });
  } else {
    var transport = nodemailer.createTransport();
    transport.sendMail(mail, callback);
  }

};

exports.format_post = function format_post(records) {

  var days = [];

  moment.lang('en', {
      calendar : {
          lastDay : '[Yesterday]',
          sameDay : '[Today]',
          nextDay : '[Tomorrow]',
          lastWeek : '[Last] dddd',
          nextWeek : 'dddd',
          sameElse : 'dddd, LL'
      }
  });

  records = records.map(function(r) {
    if( typeof r === 'string' ) {
      r = {text: r};
    }
    if(typeof r.date === 'string') {
      r.date = new Date(r.date);
    }
    if(!r.date) {
      r.date = new Date();
    }
    var dayofweek = r.date.getDay();
    if( days.indexOf( dayofweek ) == -1 ) {
      days.push( dayofweek );
    }
    return r;
  });

  var lastDay = -1;

  var result = '';
  records.map(function(r) {
    if(days.length > 1 && lastDay != r.date.getDay()) {
      lastDay = r.date.getDay();
      if(result.length != 0) {
        result += '\n';
      }
      result += moment(r.date).calendar()+'\n';
    }
    result += '- ' + r.text + '\n';
  });
  result += '@END';

  return result;
};
