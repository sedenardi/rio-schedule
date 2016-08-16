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
  events = _.map(day, function(e) {
    e.startDate = new Date(e.Start);
    e.endDate = new Date(e.End);
    e.taskName = e.Network;
    e.status = e.LiveOrTape.indexOf('LIVE') === 0 ? 'LIVE' : 'TAPE';
    e.keyFunction = function() {
      return this.startDate + this.taskName + this.endDate + this.EventName;
    };
    return e;
  });

  var keyFunction = function(d) { return d.startDate + d.taskName + d.endDate + d.EventName; }

  events = events.map(function(e1) {
    e1.overlapping = events.filter(function(e2) {
      var end1 = new Date(e1.endDate.getTime() - 1000);
      var end2 = new Date(e2.endDate.getTime() - 1000);
      return e1.startDate <= end2 && e2.startDate <= end1 &&
        e1.taskName === e2.taskName;
    }).length;
    return e1;
  });
  console.log(events);

  var format = '%H:%M';
  var gantt = d3.gantt()
    .taskTypes(networks)
    .taskStatus(statuses)
    .tickFormat(format)
    .radius(5)
    .baseClass('event')
    .keyFunction(keyFunction);
  gantt(events);

  // var selectors = d3.select('.chart')
  //   .select('.gantt-chart')
  //   .selectAll('rect');
  // selectors
  //   .on('mouseenter', function(d) { console.log(d); })
  //   .on('mouseleave', function(d) { console.log(d); });
};

drawDay('2016-08-15');
