'use strict';

const request = require('superagent');
const cheerio = require('cheerio');
const _ = require('lodash');
const moment = require('moment-timezone');
const bluebird = require('bluebird');
const fs = bluebird.promisifyAll(require('fs'));

const baseUrl = 'http://www.sportsmediawatch.com/olympics-tv-schedule-rio-2016-nbc-nbcsn-usa-gymnastics-swimming-track-more/';

const pGet = function(url) {
  return new Promise((resolve, reject) => {
    request.get(url).end((err, res) => {
      if (err) {
        return reject(res);
      }
      return resolve(res);
    });
  });
};

const populateEvent = function($element, obj) {
  if ($element.find('strong').length) {
    obj.EventName = $element.find('strong').eq(0).text().trim();
    obj.EventDetails = $element.text().replace(obj.EventName, '').trim();
  } else {
    obj.EventName = $element.text().trim();
  }
};

const populateLive = function($element, obj) {
  obj.LiveOrTape = $element.text().trim()
    .split('\n')
    .map((t) => { return t.trim(); })
    .join(', ');
};

const format = 'dddd, MMMM DD YYYY h:mm a';
const timeZone = 'America/New_York';
const parseTable = function(html) {
  const $ = cheerio.load(html);
  const table = $('#olytable').first();
  const events = _.reduce(table.find('tr'), (res, r, i) => {
    if (i === 0) { return res; }
    const row = $(r);
    if (row.find('th[colspan="5"]').length) {
      res.push({
        Date: row.find('th[colspan="5"]').eq(0).text().trim()
      });
    } else {
      const obj = {
        Date: res[res.length-1].Date
      };
      if (row.find('td').length === 5) {
        obj.Networks = row.find('td').eq(0).text().trim();
        obj.NetworksRepeat = row.find('td').eq(0).attr('rowspan');
        obj.Start = row.find('td').eq(1).text().trim();
        obj.StartRepeat = row.find('td').eq(1).attr('rowspan');
        obj.End = row.find('td').eq(2).text().trim();
        obj.EndRepeat = row.find('td').eq(2).attr('rowspan');
        populateEvent(row.find('td').eq(3), obj);
        obj.EventRepeat = row.find('td').eq(3).attr('rowspan');
        populateLive(row.find('td').eq(4), obj);
        obj.LiveOrTapeRepeat = row.find('td').eq(4).attr('rowspan');
      } else {
        let colCount = 0;
        if (res[res.length-1].NetworksRepeat) {
          obj.Networks = res[res.length-1].Networks;
          obj.NetworksRepeat = true;
        } else {
          obj.Networks = row.find('td').eq(colCount).text().trim();
          colCount++;
        }
        if (res[res.length-1].StartRepeat) {
          obj.Start = res[res.length-1].Start;
          obj.StartRepeat = true;
        } else {
          obj.Start = row.find('td').eq(colCount).text().trim();
          colCount++;
        }
        if (res[res.length-1].EndRepeat) {
          obj.End = res[res.length-1].End;
          obj.EndRepeat = true;
        } else {
          obj.End = row.find('td').eq(colCount).text().trim();
          colCount++;
        }
        if (res[res.length-1].EventRepeat) {
          obj.EventName = res[res.length-1].EventName;
          obj.EventDetails = res[res.length-1].EventDetails;
          obj.EventRepeat = true;
        } else {
          populateEvent(row.find('td').eq(colCount), obj);
          colCount++;
        }
        if (res[res.length-1].LiveOrTapeRepeat) {
          obj.LiveOrTape = res[res.length-1].LiveOrTape;
          obj.LiveOrTapeRepeat = true;
        } else {
          populateLive(row.find('td').eq(colCount), obj);
          colCount++;
        }
      }
      res.push(obj);
    }
    return res;
  }, []);

  return _.chain(events)
    .filter((e) => { return e.Networks; })
    .map((e) => {
      const start = moment.tz(`${e.Date} 2016 ${e.Start}`, format, timeZone);
      const end = moment.tz(`${e.Date} 2016 ${e.End}`, format, timeZone);
      return _.map(e.Networks.split(','), (n) => {
        return {
          Network: n.trim(),
          Start: start.toISOString(),
          End: end.toISOString(),
          EventName: e.EventName.replace(/"/g, ''),
          EventDetails: e.EventDetails ? e.EventDetails.replace(/\s/g, ' ') : undefined,
          LiveOrTape: e.LiveOrTape
        };
      });
    })
    .flatten()
    .value();
};

pGet(baseUrl).then((res) => {
  const events = parseTable(res.text);
  const saveJson = fs.writeFileAsync('schedule.json', JSON.stringify(events, null, 2));
  const js =
`var json = '${JSON.stringify(events)}';

var schedule = JSON.parse(json);
`;
  const saveJs = fs.writeFileAsync('scheduleData.js', js);
  return Promise.all([saveJson, saveJs]);
}).catch((err) => {
  console.log(err);
});
