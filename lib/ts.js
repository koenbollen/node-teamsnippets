
var nodemailer = require('nodemailer');

exports.postupdate = function postupdate(records, options, callback) {

  if(isNaN(options.team)) {
    throw new Error('missing option field: team');
  }
  if(!options.from) {
    throw new Error('missing option field: from');
  }

  var text = '';
  records.map(function(r) {
    var t = typeof r === 'string' ? r : r.text;
    text += '-   ' + t + '\n';
  });
  text += '@END\n';

  console.dir( text );

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
