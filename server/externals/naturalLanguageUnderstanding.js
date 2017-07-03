const discoveryV1 = require('watson-developer-cloud').DiscoveryV1;
const indeed = require('./indeed.js');
const fs = require('fs');
const path = require('path');
let serverPath = path.join(__dirname, '../');
let NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
let natural_language_understanding = new NaturalLanguageUnderstandingV1({
  'username': 'db72ffe4-c5f3-4719-9660-4c70b9a23b58',
  'password': 'z5GHIPIXtFQb',
  'version_date': '2017-02-27'
});

module.exports.analyze = (doc, callback) => {
  doc.answer_units[0].content[0].text
  var parameters = {
    'text': doc.answer_units[0].content[0].text,
    'features': {
      'entities': {
        'emotion': true,
        'sentiment': true,
        'limit': 2
      },
      'keywords': {
        'emotion': true,
        'sentiment': true,
        'limit': 2
      }
    }
  }
  natural_language_understanding.analyze(parameters, function(err, result) {
    if (err)
      console.log('error:', err);
    else {
      //console.log('Response from ANALYZER...');
      let keywords = result.keywords.map((keyword) => {
        return keyword.text;
      });
      
      //console.log('calling indeed.. userReq=', userReq);
      callback(keywords);
    }
  });
}