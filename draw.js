/* global _ */
/* global d3 */
/* global moment */
/* global schedule */

var statuses = {
  'LIVE': 'live',
  'TAPE': 'tape'
};

var drawDay = function(date) {
  var day = _.filter(schedule, function(e) {
    return moment(e.Start).format('YYYYMMDD') === moment(date).format('YYYYMMDD');
  });
  var networks = _.chain(day)
    .map('Network')
    .uniq()
    .value();
  var events = _.map(day, function(e) {
    e.startDate = new Date(e.Start);
    e.endDate = new Date(e.End);
    e.taskName = e.Network;
    e.status = e.LiveOrTape.indexOf('LIVE') === 0 ? 'LIVE' : 'TAPE';
    return e;
  });

  var format = '%H:%M';
  var gantt = d3.gantt()
    .taskTypes(networks)
    .taskStatus(statuses)
    .tickFormat(format)
    .radius(5)
    .baseClass('event');
  gantt(events);

  var selectors = d3.select('.chart')
    .select('.gantt-chart')
    .selectAll('rect');
  selectors
    .on('mouseenter', function(d) { console.log(d); })
    .on('mouseleave', function(d) { console.log(d); });
};

drawDay(Date.now());
